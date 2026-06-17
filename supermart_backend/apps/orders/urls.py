from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('delivery-zones/', views.DeliveryZoneListView.as_view()),
    path('track/<str:order_number>/', views.PublicOrderTrackingView.as_view()),

    # Customer
    path('orders/', views.PlaceOrderView.as_view()),
    path('orders/history/', views.CustomerOrderListView.as_view()),
    path('orders/<str:order_number>/', views.CustomerOrderDetailView.as_view()),

    # Admin
    path('admin/orders/', views.AdminOrderListView.as_view()),
    path('admin/orders/<int:pk>/', views.AdminOrderDetailView.as_view()),
    path('admin/orders/<int:pk>/status/', views.AdminOrderStatusUpdateView.as_view()),
    path('admin/orders/<int:pk>/payment-status/', views.AdminOrderPaymentStatusUpdateView.as_view()),

    # Delivery staff
    path('delivery/orders/', views.DeliveryOrderListView.as_view()),
    path('delivery/orders/<int:pk>/', views.DeliveryOrderDetailView.as_view()),
    path('delivery/orders/<int:pk>/status/', views.DeliveryOrderStatusUpdateView.as_view()),
]
