"""
URLs for accounts app.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    ChangePasswordView,
    CurrentUserProfileView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    RegisterView,
    UserManagementViewSet,
)

app_name = "accounts"

router = DefaultRouter()
router.register(r"users", UserManagementViewSet, basename="admin-user")

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # Profile & Password
    path("me/", CurrentUserProfileView.as_view(), name="current_user"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    # Admin User Management
    path("", include(router.urls)),
]
