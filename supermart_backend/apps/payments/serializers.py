from rest_framework import serializers
from apps.orders.models import Order, ONLINE_PAYMENT_METHODS
from .models import Payment


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()

    def validate_order_id(self, value):
        request = self.context['request']
        try:
            order = Order.objects.get(id=value, user=request.user)
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found.')

        if order.payment_method not in ONLINE_PAYMENT_METHODS:
            raise serializers.ValidationError(
                'This order uses a non-online payment method.'
            )
        if order.status not in ('pending',):
            raise serializers.ValidationError(
                f'Order cannot be paid — current status is "{order.status}".'
            )
        if order.payment_status == 'paid':
            raise serializers.ValidationError('This order has already been paid.')

        self.context['order'] = order
        return value


class PaymentStatusSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    order_status = serializers.CharField()
    payment_status = serializers.CharField()
    latest_payment = serializers.SerializerMethodField()

    def get_latest_payment(self, obj):
        payment = obj.payments.first()
        if not payment:
            return None
        return {
            'gateway': payment.gateway,
            'status': payment.status,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'created_at': payment.created_at,
        }

    def to_representation(self, order):
        return {
            'order_number': order.order_number,
            'order_status': order.status,
            'payment_status': order.payment_status,
            'latest_payment': self.get_latest_payment(order),
        }
