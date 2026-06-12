from django.urls import path
from .views import (
    AdminCategoryListCreateView,
    AdminInventoryView,
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminProductVariantCreateView,
    AdminReviewDeleteView,
    AdminReviewListView,
    AdminStockAdjustView,
    AdminVariantDetailView,
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
)

urlpatterns = [
    # Public
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),

    # Admin — categories
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin-category-list'),

    # Admin — products
    path('admin/products/', AdminProductListCreateView.as_view(), name='admin-product-list'),
    path('admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('admin/products/<int:product_id>/variants/', AdminProductVariantCreateView.as_view(), name='admin-variant-create'),

    # Admin — variants
    path('admin/variants/<int:pk>/', AdminVariantDetailView.as_view(), name='admin-variant-detail'),
    path('admin/variants/<int:pk>/stock/', AdminStockAdjustView.as_view(), name='admin-stock-adjust'),

    # Admin — inventory
    path('admin/inventory/', AdminInventoryView.as_view(), name='admin-inventory'),

    # Admin — reviews
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/reviews/<int:pk>/', AdminReviewDeleteView.as_view(), name='admin-review-delete'),
]
