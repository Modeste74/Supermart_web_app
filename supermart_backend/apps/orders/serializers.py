from decimal import Decimal
from django.db import models, transaction
from rest_framework import serializers

from apps.catalog.models import ProductVariant
from apps.cart.models import Cart
from apps.users.models import Address
from core.utils import get_available_qty, lock_order_stock, release_order_stock

from .models import (
    DeliveryZone,
    Order,
    OrderItem,
    OrderStatusHistory,
    ONLINE_PAYMENT_METHODS,
)


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = ['id', 'name', 'covered_areas', 'delivery_fee', 'estimated_days']


# --- Customer-facing serializers ---

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'note', 'changed_by_name', 'created_at']

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.full_name
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'sku_snapshot',
            'product_name_snapshot',
            'variant_label_snapshot',
            'unit_price_snapshot',
            'quantity',
            'line_total',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    delivery_zone = DeliveryZoneSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'fulfilment_type',
            'payment_method',
            'payment_status',
            'subtotal',
            'delivery_fee',
            'discount_amount',
            'total',
            'delivery_zone',
            'special_instructions',
            'items',
            'status_history',
            'created_at',
            'updated_at',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    first_item = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'fulfilment_type',
            'payment_method',
            'payment_status',
            'total',
            'item_count',
            'first_item',
            'created_at',
        ]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_first_item(self, obj):
        item = obj.items.first()
        if item:
            return {
                'name': item.product_name_snapshot,
                'variant': item.variant_label_snapshot,
            }
        return None


class PlaceOrderSerializer(serializers.Serializer):
    fulfilment_type = serializers.ChoiceField(choices=['delivery', 'pickup'])
    payment_method = serializers.ChoiceField(
        choices=['mobile_money', 'card', 'cash_on_delivery', 'pay_in_store']
    )
    delivery_address_id = serializers.IntegerField(required=False, allow_null=True)
    delivery_zone_id = serializers.IntegerField(required=False, allow_null=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        if data['fulfilment_type'] == 'delivery':
            if not data.get('delivery_address_id'):
                raise serializers.ValidationError(
                    {'delivery_address_id': 'A delivery address is required for delivery orders.'}
                )
            if not data.get('delivery_zone_id'):
                raise serializers.ValidationError(
                    {'delivery_zone_id': 'A delivery zone is required for delivery orders.'}
                )
        return data

    def validate_delivery_address_id(self, value):
        if value is None:
            return value
        request = self.context['request']
        try:
            Address.objects.get(id=value, user=request.user)
        except Address.DoesNotExist:
            raise serializers.ValidationError('Address not found.')
        return value

    def validate_delivery_zone_id(self, value):
        if value is None:
            return value
        try:
            DeliveryZone.objects.get(id=value, is_active=True)
        except DeliveryZone.DoesNotExist:
            raise serializers.ValidationError('Delivery zone not found.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        user = request.user

        # 1. Get cart — must have items
        try:
            cart = Cart.objects.prefetch_related(
                'items__product_variant'
            ).get(user=user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError({'cart': 'Your cart is empty.'})

        cart_items = list(cart.items.all())
        if not cart_items:
            raise serializers.ValidationError({'cart': 'Your cart is empty.'})

        # 2. Stock validation — use SELECT FOR UPDATE to prevent race conditions
        stock_errors = []
        variants = {}
        for item in cart_items:
            variant = ProductVariant.objects.select_for_update().get(
                id=item.product_variant_id
            )
            available = get_available_qty(variant)
            if available < item.quantity:
                stock_errors.append(
                    f'"{variant.product.name} ({variant.variant_label})" — '
                    f'only {available} unit(s) available.'
                )
            variants[item.id] = variant

        if stock_errors:
            raise serializers.ValidationError({'stock': stock_errors})

        # 3. Resolve address and zone
        delivery_address = None
        delivery_zone = None
        delivery_fee = Decimal('0.00')

        if validated_data['fulfilment_type'] == 'delivery':
            delivery_address = Address.objects.get(
                id=validated_data['delivery_address_id'], user=user
            )
            delivery_zone = DeliveryZone.objects.get(
                id=validated_data['delivery_zone_id']
            )
            delivery_fee = delivery_zone.delivery_fee

        # 4. Calculate totals
        subtotal = sum(
            variants[item.id].price * item.quantity for item in cart_items
        )
        total = subtotal + delivery_fee

        # 5. Create Order
        order = Order.objects.create(
            user=user,
            fulfilment_type=validated_data['fulfilment_type'],
            payment_method=validated_data['payment_method'],
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount_amount=Decimal('0.00'),
            total=total,
            delivery_address=delivery_address,
            delivery_zone=delivery_zone,
            special_instructions=validated_data.get('special_instructions', ''),
        )

        # 6. Create OrderItems (snapshots)
        lock_items = []
        for item in cart_items:
            variant = variants[item.id]
            OrderItem.objects.create(
                order=order,
                product_variant=variant,
                sku_snapshot=variant.sku,
                product_name_snapshot=variant.product.name,
                variant_label_snapshot=variant.variant_label,
                unit_price_snapshot=variant.price,
                quantity=item.quantity,
            )
            lock_items.append((variant.id, item.quantity))

        # 7. Log initial status
        OrderStatusHistory.objects.create(
            order=order,
            status='pending',
            changed_by=user,
        )

        # 8. Handle stock based on payment method
        payment_method = validated_data['payment_method']

        if payment_method in ONLINE_PAYMENT_METHODS:
            # Lock stock in Redis — release on payment webhook (Phase 7)
            lock_order_stock(lock_items)
        else:
            # COD / pay-in-store: decrement MySQL stock immediately, confirm order
            for item in cart_items:
                variant = variants[item.id]
                ProductVariant.objects.filter(id=variant.id).update(
                    stock_qty=variant.stock_qty - item.quantity
                )
            order.status = 'confirmed'
            order.save(update_fields=['status'])
            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                note='Auto-confirmed (cash/in-store payment).',
                changed_by=user,
            )

        # 9. Clear cart
        cart.items.all().delete()

        return order


# --- Admin serializers ---

class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'fulfilment_type',
            'payment_method',
            'payment_status',
            'total',
            'customer_name',
            'customer_email',
            'item_count',
            'created_at',
        ]

    def get_customer_name(self, obj):
        return obj.user.full_name

    def get_customer_email(self, obj):
        return obj.user.email

    def get_item_count(self, obj):
        return obj.items.count()


class AdminOrderSerializer(AdminOrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    delivery_zone = DeliveryZoneSerializer(read_only=True)

    class Meta(AdminOrderListSerializer.Meta):
        fields = AdminOrderListSerializer.Meta.fields + [
            'subtotal',
            'delivery_fee',
            'discount_amount',
            'special_instructions',
            'delivery_zone',
            'items',
            'status_history',
            'updated_at',
        ]


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c[0] for c in Order._meta.get_field('status').choices])
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_status(self, value):
        order = self.context['order']
        # Prevent re-setting the same status
        if order.status == value:
            raise serializers.ValidationError(f'Order is already {value}.')
        return value

    @transaction.atomic
    def save(self):
        order = self.context['order']
        request = self.context['request']
        new_status = self.validated_data['status']
        note = self.validated_data.get('note', '')

        # If confirming an online-payment order (admin manually confirms), decrement stock
        if (
            new_status == 'confirmed'
            and order.status == 'pending'
            and order.payment_method in ONLINE_PAYMENT_METHODS
        ):
            for item in order.items.select_related('product_variant'):
                ProductVariant.objects.filter(id=item.product_variant_id).update(
                    stock_qty=models.F('stock_qty') - item.quantity
                )
            lock_items = [(i.product_variant_id, i.quantity) for i in order.items.all()]
            release_order_stock(lock_items)

        order.status = new_status
        order.save(update_fields=['status'])
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            note=note,
            changed_by=request.user,
        )
        return order
