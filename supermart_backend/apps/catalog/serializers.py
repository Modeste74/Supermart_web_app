from rest_framework import serializers
from .models import Category, Product, ProductVariant, Review


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'image_url', 'subcategories']

    def get_subcategories(self, obj):
        active = obj.subcategories.filter(is_active=True)
        return CategorySerializer(active, many=True).data


class ProductVariantSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'variant_label', 'variant_type',
            'price', 'compare_at_price', 'stock_qty',
            'low_stock_threshold', 'is_active',
            'is_low_stock', 'is_out_of_stock',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    in_stock = serializers.ReadOnlyField()
    starting_price = serializers.ReadOnlyField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'category_slug',
            'brand', 'thumbnail', 'in_stock', 'starting_price',
        ]

    def get_thumbnail(self, obj):
        return obj.images[0] if obj.images else None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'category',
            'brand', 'images', 'is_active', 'in_stock',
            'variants', 'created_at', 'updated_at',
        ]


# --- Admin serializers ---

class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'image_url', 'is_active']
        read_only_fields = ['slug']


class AdminProductVariantSerializer(serializers.ModelSerializer):
    # SKU is optional — auto-generated from product name + variant label if omitted
    sku = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'variant_label', 'variant_type',
            'price', 'compare_at_price', 'stock_qty',
            'low_stock_threshold', 'is_active',
        ]

    def validate_sku(self, value):
        return value if value else ''


class AdminProductSerializer(serializers.ModelSerializer):
    variants = AdminProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'category',
            'brand', 'images', 'is_active', 'variants',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['slug']

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    category = serializers.CharField(source='product.category.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product_id', 'product_name', 'category',
            'sku', 'variant_label', 'variant_type',
            'price', 'stock_qty', 'low_stock_threshold',
            'is_active', 'is_low_stock', 'is_out_of_stock', 'stock_status',
        ]

    def get_stock_status(self, obj):
        if obj.is_out_of_stock:
            return 'out_of_stock'
        if obj.is_low_stock:
            return 'low_stock'
        return 'in_stock'


class StockAdjustSerializer(serializers.Serializer):
    stock_qty = serializers.IntegerField(min_value=0)


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'author_name', 'rating', 'comment', 'is_verified_purchase', 'created_at']

    def get_author_name(self, obj):
        return obj.user.full_name


class CreateReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        user = self.context['request'].user
        product = self.context['product']
        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError('You have already reviewed this product.')
        return data

    def create(self, validated_data):
        from apps.orders.models import OrderItem
        user = self.context['request'].user
        product = self.context['product']
        has_purchased = OrderItem.objects.filter(
            order__user=user,
            order__status='delivered',
            product_variant__product=product,
        ).exists()
        return Review.objects.create(
            user=user,
            product=product,
            rating=validated_data['rating'],
            comment=validated_data.get('comment', ''),
            is_verified_purchase=has_purchased,
        )


class AdminReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'author_name', 'author_email', 'product_name',
            'rating', 'comment', 'is_verified_purchase', 'created_at',
        ]

    def get_author_name(self, obj):
        return obj.user.full_name

    def get_author_email(self, obj):
        return obj.user.email

    def get_product_name(self, obj):
        return obj.product.name
