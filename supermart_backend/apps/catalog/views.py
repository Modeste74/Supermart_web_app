from django.db.models import Avg
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminOrSuperAdmin
from .models import Category, Product, ProductVariant, Review
from .serializers import (
    AdminCategorySerializer,
    AdminProductSerializer,
    AdminProductVariantSerializer,
    AdminReviewSerializer,
    CategorySerializer,
    CreateReviewSerializer,
    InventorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewSerializer,
    StockAdjustSerializer,
)


# ── Public views ──────────────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(is_active=True, parent=None).prefetch_related('subcategories')


class ProductListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('category').prefetch_related('variants')

        category = self.request.query_params.get('category')
        brand = self.request.query_params.get('brand')
        search = self.request.query_params.get('search')
        in_stock = self.request.query_params.get('in_stock')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if category:
            qs = qs.filter(category__slug=category)
        if brand:
            qs = qs.filter(brand__icontains=brand)
        if search:
            qs = qs.filter(name__icontains=search)
        if in_stock == 'true':
            qs = qs.filter(variants__stock_qty__gt=0, variants__is_active=True).distinct()
        if min_price and max_price:
            qs = qs.filter(variants__price__gte=min_price, variants__price__lte=max_price).distinct()
        elif min_price:
            qs = qs.filter(variants__price__gte=min_price).distinct()
        elif max_price:
            qs = qs.filter(variants__price__lte=max_price).distinct()

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category').prefetch_related('variants')


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()


class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminProductSerializer

    def get_queryset(self):
        qs = Product.objects.all().select_related('category').prefetch_related('variants')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class AdminProductVariantCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminProductVariantSerializer

    def perform_create(self, serializer):
        product = generics.get_object_or_404(Product, pk=self.kwargs['product_id'])
        serializer.save(product=product)


class AdminVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminProductVariantSerializer
    queryset = ProductVariant.objects.all()


class AdminInventoryView(generics.ListAPIView):
    """Flat list of all SKUs with stock levels for the inventory management page."""
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = InventorySerializer

    def get_queryset(self):
        qs = ProductVariant.objects.select_related('product', 'product__category').order_by(
            'product__name', 'variant_label'
        )
        stock_filter = self.request.query_params.get('stock_status')
        search = self.request.query_params.get('search')

        if search:
            qs = qs.filter(
                models.Q(sku__icontains=search) |
                models.Q(product__name__icontains=search) |
                models.Q(variant_label__icontains=search)
            )
        if stock_filter == 'low_stock':
            qs = qs.filter(stock_qty__gt=0, stock_qty__lte=models.F('low_stock_threshold'))
        elif stock_filter == 'out_of_stock':
            qs = qs.filter(stock_qty=0)

        return qs


class AdminStockAdjustView(APIView):
    """Quick stock quantity update for a single variant."""
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        variant = generics.get_object_or_404(ProductVariant, pk=pk)
        serializer = StockAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant.stock_qty = serializer.validated_data['stock_qty']
        variant.save()
        return Response(InventorySerializer(variant).data)


# ── Review views ──────────────────────────────────────────────────────────────

class ProductReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        reviews = Review.objects.filter(product=product).select_related('user')
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        return Response({
            'count': reviews.count(),
            'average_rating': round(float(avg), 1) if avg else None,
            'results': ReviewSerializer(reviews, many=True).data,
        })

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        serializer = CreateReviewSerializer(
            data=request.data,
            context={'request': request, 'product': product},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class AdminReviewListView(generics.ListAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AdminReviewSerializer
    queryset = Review.objects.select_related('user', 'product').order_by('-created_at')
    pagination_class = None


class AdminReviewDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    queryset = Review.objects.all()
