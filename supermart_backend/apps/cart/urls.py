from django.urls import path
from .views import (
    ApplyCouponView,
    CartItemCreateView,
    CartItemDetailView,
    CartView,
    MergeCartView,
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('cart/merge/', MergeCartView.as_view(), name='cart-merge'),
    path('cart/apply-coupon/', ApplyCouponView.as_view(), name='cart-apply-coupon'),
]
