from rest_framework import serializers

from apps.catalog.models import ProductVariant
from .models import Cart, CartItem


class CartVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'product_name', 'product_slug',
            'variant_label', 'price', 'compare_at_price',
            'stock_qty', 'thumbnail',
        ]

    def get_thumbnail(self, obj):
        return obj.product.images[0] if obj.product.images else None


class CartItemSerializer(serializers.ModelSerializer):
    product_variant = CartVariantSerializer(read_only=True)
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product_variant', 'quantity', 'line_total']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.ReadOnlyField()
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'subtotal', 'item_count']


class AddToCartSerializer(serializers.Serializer):
    product_variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, data):
        try:
            variant = ProductVariant.objects.select_related('product').get(
                pk=data['product_variant_id'], is_active=True
            )
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError({'product_variant_id': 'Variant not found or inactive.'})

        if variant.stock_qty < data['quantity']:
            raise serializers.ValidationError(
                {'quantity': f'Only {variant.stock_qty} unit(s) available.'}
            )

        data['variant'] = variant
        return data


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, data):
        variant = self.context['cart_item'].product_variant
        if variant.stock_qty < data['quantity']:
            raise serializers.ValidationError(
                {'quantity': f'Only {variant.stock_qty} unit(s) available.'}
            )
        return data
