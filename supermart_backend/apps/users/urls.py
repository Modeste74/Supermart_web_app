from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AddressDetailView,
    AddressListCreateView,
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    ResetPasswordView,
    SuperAdminUserDetailView,
    SuperAdminUserListView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('account/profile/', ProfileView.as_view(), name='account-profile'),
    path('account/change-password/', ChangePasswordView.as_view(), name='account-change-password'),
    path('account/addresses/', AddressListCreateView.as_view(), name='account-addresses'),
    path('account/addresses/<int:pk>/', AddressDetailView.as_view(), name='account-address-detail'),

    # Super admin — user management
    path('super-admin/users/', SuperAdminUserListView.as_view(), name='super-admin-user-list'),
    path('super-admin/users/<int:pk>/', SuperAdminUserDetailView.as_view(), name='super-admin-user-detail'),
]
