from django.urls import path

from .views import DashboardView, PromotionDetailView, PromotionListCreateView, SalesReportView

urlpatterns = [
    path('admin/dashboard/', DashboardView.as_view()),
    path('admin/reports/sales/', SalesReportView.as_view()),
    path('admin/promotions/', PromotionListCreateView.as_view()),
    path('admin/promotions/<int:pk>/', PromotionDetailView.as_view()),
]
