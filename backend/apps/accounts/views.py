"""
Views for accounts app — authentication, profile management, and user administration.
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.serializers import (
    AdminUserManagementSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsAdmin
from apps.core.responses import created_response, no_content_response, success_response

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new clinical user account.

    POST /api/v1/auth/register/
    Public endpoint. Returns created user details (excluding password).
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens so user is immediately logged in upon registration
        refresh = RefreshToken.for_user(user)
        # Custom claims on token
        refresh["email"] = user.email
        refresh["role"] = user.role
        refresh["full_name"] = user.full_name
        refresh["department"] = user.department

        data = {
            "user": UserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
        }
        return created_response(
            data=data,
            message="User registration successful.",
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Obtain JWT access and refresh token pair with clinical user metadata.

    POST /api/v1/auth/login/
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request: Request, *args, **kwargs) -> Response:
        from django.contrib.auth import user_logged_in

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        user_logged_in.send(sender=self.__class__, request=request, user=user)
        return success_response(
            data=serializer.validated_data,
            message="Login successful.",
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh an expired JWT access token.

    POST /api/v1/auth/token/refresh/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        response = super().post(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message="Token refreshed successfully.",
        )


class LogoutView(APIView):
    """
    Blacklist the refresh token and log out the user.

    POST /api/v1/auth/logout/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        from django.contrib.auth import user_logged_out

        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            user_logged_out.send(sender=self.__class__, request=request, user=request.user)
            return success_response(
                message="Logout successful. Token revoked.",
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Token invalid or already revoked: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CurrentUserProfileView(APIView):
    """
    Get or update the profile of the currently authenticated user.

    GET /api/v1/auth/me/
    PUT /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return success_response(data=serializer.data)

    def put(self, request: Request) -> Response:
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=False,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserSerializer(request.user).data,
            message="Profile updated successfully.",
        )

    def patch(self, request: Request) -> Response:
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserSerializer(request.user).data,
            message="Profile updated successfully.",
        )


class ChangePasswordView(APIView):
    """
    Change the authenticated user's password.

    POST /api/v1/auth/change-password/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(message="Password changed successfully.")


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Administrative user management.

    Full CRUD on clinical staff accounts, only accessible by ADMIN role.
    GET /api/v1/auth/users/
    POST /api/v1/auth/users/
    GET /api/v1/auth/users/{id}/
    PUT /api/v1/auth/users/{id}/
    DELETE /api/v1/auth/users/{id}/
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserManagementSerializer
    pagination_class = StandardResultsPagination
    queryset = User.objects.all().order_by("-created_at")
    filterset_fields = ["role", "is_active", "department"]
    search_fields = ["email", "username", "first_name", "last_name", "department"]
    ordering_fields = ["created_at", "email", "last_name", "role"]

    def perform_destroy(self, instance: User) -> None:
        # Prevent self-deletion of the active admin
        if instance.id == self.request.user.id:
            from apps.core.exceptions import ConflictError
            raise ConflictError("Administrators cannot delete their own account.")
        # Deactivate rather than hard-delete to maintain audit trails
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
