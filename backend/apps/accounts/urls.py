"""
URLs for accounts app — authentication, registration, password reset,
email verification, profiles, and administration.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    ChangePasswordView,
    CurrentUserView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    EmailVerificationConfirmView,
    EmailVerificationRequestView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    UserManagementViewSet,
    UserProfileView,
)

app_name = "accounts"

router = DefaultRouter()
router.register(r"users", UserManagementViewSet, basename="admin-user")

urlpatterns = [
    # Core Authentication Lifecycle
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # Password Management & Recovery
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    # Email Verification
    path("email-verify/request/", EmailVerificationRequestView.as_view(), name="email_verify_request"),
    path("email-verify/confirm/", EmailVerificationConfirmView.as_view(), name="email_verify_confirm"),

    # Profile & Identity
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("profile/", UserProfileView.as_view(), name="user_profile"),

    # Administrative User Management (ADMIN role only)
    path("", include(router.urls)),
]
