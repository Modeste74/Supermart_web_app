from django.urls import path

from .views import (
    DashboardView,
    PromotionDetailView,
    PromotionListCreateView,
    SalesReportView,
    SuperAdminAnalyticsView,
    SuperAdminSettingsView,
)

urlpatterns = [
    path('admin/dashboard/', DashboardView.as_view()),
    path('admin/reports/sales/', SalesReportView.as_view()),
    path('admin/promotions/', PromotionListCreateView.as_view()),
    path('admin/promotions/<int:pk>/', PromotionDetailView.as_view()),

    # Super admin
    path('super-admin/analytics/', SuperAdminAnalyticsView.as_view()),
    path('super-admin/settings/', SuperAdminSettingsView.as_view()),
]
