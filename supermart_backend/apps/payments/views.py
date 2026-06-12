import json
import logging

import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .gateways import flutterwave as flw
from .gateways import stripe_gateway as sgw
from .models import Payment
from .serializers import InitiatePaymentSerializer, PaymentStatusSerializer
from .utils import confirm_payment, fail_payment

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        order = serializer.context['order']
        callback_url = (
            f"{settings.FRONTEND_URL}/checkout/payment-callback"
            f"?order_id={order.id}&order_number={order.order_number}"
        )

        # Decide gateway based on payment method
        if order.payment_method in ('mobile_money', 'card'):
            gateway = 'flutterwave'
        else:
            return Response(
                {'detail': 'No gateway for this payment method.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if gateway == 'flutterwave':
                payment_url = flw.create_payment_link(order, redirect_url=callback_url)
                session_id = None
            else:  # stripe
                payment_url, session_id = sgw.create_checkout_session(
                    order,
                    success_url=callback_url + '&gateway=stripe',
                    cancel_url=f"{settings.FRONTEND_URL}/account/orders/{order.order_number}",
                )
                gateway = 'stripe'
        except Exception as exc:
            logger.exception('Payment initiation failed for order %s', order.order_number)
            return Response(
                {'detail': 'Could not connect to payment gateway. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Create pending payment record
        Payment.objects.create(
            order=order,
            payment_method=order.payment_method,
            gateway=gateway,
            amount=order.total,
            currency=settings.FLW_CURRENCY if gateway == 'flutterwave' else settings.STRIPE_CURRENCY.upper(),
            gateway_reference=session_id or '',
        )

        return Response({'payment_url': payment_url})


@method_decorator(csrf_exempt, name='dispatch')
class FlutterwaveWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not flw.verify_webhook_signature(request):
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'detail': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = payload.get('event')
        data = payload.get('data', {})

        if event_type != 'charge.completed':
            return Response({'detail': 'Event ignored.'})

        tx_ref = data.get('tx_ref', '')
        transaction_id = data.get('id')
        charge_status = data.get('status', '')

        try:
            order = Order.objects.get(order_number=tx_ref)
        except Order.DoesNotExist:
            logger.warning('Flutterwave webhook: order %s not found', tx_ref)
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment = order.payments.filter(gateway='flutterwave', status='pending').first()
        if not payment:
            # Already processed
            return Response({'detail': 'Already processed.'})

        if charge_status == 'successful':
            try:
                # Double-verify with Flutterwave API
                tx_data = flw.verify_transaction(transaction_id)
                if tx_data.get('status') == 'successful' and str(tx_data.get('tx_ref')) == tx_ref:
                    confirm_payment(payment, gateway_reference=transaction_id, gateway_response=payload)
                else:
                    fail_payment(payment, gateway_response=payload)
            except Exception:
                logger.exception('Flutterwave verification failed for tx %s', transaction_id)
                return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            fail_payment(payment, gateway_response=payload)

        return Response({'detail': 'OK'})


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        try:
            event = sgw.construct_webhook_event(request.body, sig_header)
        except stripe.error.SignatureVerificationError:
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception:
            return Response({'detail': 'Webhook error.'}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            order_number = session.get('metadata', {}).get('order_number', '')

            try:
                order = Order.objects.get(order_number=order_number)
            except Order.DoesNotExist:
                logger.warning('Stripe webhook: order %s not found', order_number)
                return Response(status=status.HTTP_404_NOT_FOUND)

            payment = order.payments.filter(gateway='stripe', status='pending').first()
            if payment:
                confirm_payment(
                    payment,
                    gateway_reference=session.get('payment_intent', session['id']),
                    gateway_response=event['data']['object'],
                )

        elif event['type'] == 'checkout.session.expired':
            session = event['data']['object']
            order_number = session.get('metadata', {}).get('order_number', '')
            try:
                order = Order.objects.get(order_number=order_number)
                payment = order.payments.filter(gateway='stripe', status='pending').first()
                if payment:
                    fail_payment(payment, gateway_response=event['data']['object'])
            except Order.DoesNotExist:
                pass

        return Response({'detail': 'OK'})


class PaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        serializer = PaymentStatusSerializer()
        return Response(serializer.to_representation(order))
