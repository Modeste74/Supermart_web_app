from django.urls import path
from . import views

urlpatterns = [
    path('payments/initiate/', views.InitiatePaymentView.as_view()),
    path('payments/webhook/flutterwave/', views.FlutterwaveWebhookView.as_view()),
    path('payments/webhook/stripe/', views.StripeWebhookView.as_view()),
    path('payments/<int:order_id>/status/', views.PaymentStatusView.as_view()),
]
