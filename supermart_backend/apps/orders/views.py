from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from core.permissions import IsCustomer, IsAdmin, IsAdminOrSuperAdmin, IsDelivery

from .models import DeliveryZone, Order
from .serializers import (
    DeliveryZoneSerializer,
    OrderListSerializer,
    OrderSerializer,
    PlaceOrderSerializer,
    AdminOrderListSerializer,
    AdminOrderSerializer,
    UpdateOrderStatusSerializer,
)


class DeliveryZoneListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = DeliveryZoneSerializer
    queryset = DeliveryZone.objects.filter(is_active=True)
    pagination_class = None


# --- Customer views ---

class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceOrderSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class CustomerOrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class CustomerOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items', 'status_history__changed_by', 'delivery_zone')


class PublicOrderTrackingView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = OrderSerializer
    lookup_field = 'order_number'
    queryset = Order.objects.prefetch_related(
        'items', 'status_history__changed_by', 'delivery_zone'
    )


# --- Admin views ---

class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminOrderListSerializer

    def get_queryset(self):
        qs = Order.objects.select_related('user').prefetch_related('items')
        status_filter = self.request.query_params.get('status')
        payment_filter = self.request.query_params.get('payment_status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if payment_filter:
            qs = qs.filter(payment_status=payment_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs


class AdminOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        return Order.objects.select_related('user').prefetch_related(
            'items', 'status_history__changed_by', 'delivery_zone'
        )


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def put(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = UpdateOrderStatusSerializer(
            data=request.data,
            context={'order': order, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(AdminOrderSerializer(order).data)


# --- Delivery staff views ---

class DeliveryOrderListView(generics.ListAPIView):
    permission_classes = [IsDelivery]
    serializer_class = AdminOrderListSerializer
    pagination_class = None

    def get_queryset(self):
        return Order.objects.filter(
            status__in=['dispatched', 'out_for_delivery']
        ).select_related('user').prefetch_related('items')


class DeliveryOrderStatusUpdateView(APIView):
    permission_classes = [IsDelivery]

    def put(self, request, pk):
        order = get_object_or_404(
            Order, pk=pk, status__in=['dispatched', 'out_for_delivery']
        )
        allowed = {'out_for_delivery', 'delivered'}
        serializer = UpdateOrderStatusSerializer(
            data=request.data,
            context={'order': order, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data['status'] not in allowed:
            return Response(
                {'status': 'Delivery staff can only set out_for_delivery or delivered.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = serializer.save()
        return Response(AdminOrderSerializer(order).data)
