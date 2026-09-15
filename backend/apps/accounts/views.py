"""
Views for accounts app — authentication, registration, password reset,
email verification, profiles, and administrative user management.
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
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
    EmailVerificationConfirmSerializer,
    EmailVerificationRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    signer,
)
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsAdmin
from apps.core.responses import created_response, success_response
from apps.core.throttles import AuthBurstRateThrottle, PasswordResetRateThrottle

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new user account.

    POST /api/v1/auth/register/
    Public endpoint. Returns user details and immediate JWT authentication pair.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthBurstRateThrottle]
    serializer_class = UserRegistrationSerializer

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens so user is immediately logged in upon registration
        refresh = RefreshToken.for_user(user)
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
    throttle_classes = [AuthBurstRateThrottle]
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
    Blacklist the refresh token and invalidate the user session.

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
                message="Logout successful. Token invalidated.",
            )
        except Exception as e:
            logger.warning("Failed token blacklisting attempt: %s", e)
            return Response(
                {"success": False, "message": "Token invalid or already revoked."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PasswordResetRequestView(APIView):
    """
    Initiate a password reset flow.

    POST /api/v1/auth/password-reset/
    Accepts email, generates a cryptographically secure one-time token,
    and transmits instructions. Avoids account enumeration by returning
    success even if the email does not exist.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request: Request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/reset-password?uid={uidb64}&token={token}"

            try:
                send_mail(
                    subject="HealthNova AI — Password Reset",
                    message=f"You requested a password reset for your HealthNova AI clinical account. Use this secure link to set a new password:\n\n{reset_url}\n\nIf you did not request this, please contact security immediately.\n\nHealthNova AI — AI-Powered Clinical Decision Support & Patient Risk Intelligence",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error("Failed to dispatch password reset email: %s", e)

        # Consistent safe response to prevent email harvesting
        return success_response(
            message="If an account exists with this email address, password reset instructions have been sent.",
            data={"email": email}
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with cryptographic token.

    POST /api/v1/auth/password-reset/confirm/
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            message="Password has been reset successfully. You may now log in with your new password.",
        )


class EmailVerificationRequestView(APIView):
    """
    Request an email verification link.

    POST /api/v1/auth/email-verify/request/
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AuthBurstRateThrottle]

    def post(self, request: Request) -> Response:
        user = request.user
        if user.is_email_verified:
            return success_response(message="Email address is already verified.")

        token = signer.sign(str(user.id))
        verify_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={token}"

        try:
            send_mail(
                subject="HealthNova AI — Verify Your Account",
                message=f"Please verify your HealthNova AI clinical account email address by clicking the link:\n\n{verify_url}\n\nHealthNova AI — AI-Powered Clinical Decision Support & Patient Risk Intelligence",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Failed to dispatch verification email: %s", e)

        return success_response(
            message="Email verification instructions have been dispatched.",
            data={"token": token}
        )


class EmailVerificationConfirmView(APIView):
    """
    Verify email token.

    POST /api/v1/auth/email-verify/confirm/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["token"]
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])

        return success_response(
            message="Email address verified successfully.",
            data={"is_email_verified": True}
        )


class CurrentUserView(APIView):
    """
    Retrieve or update authenticated user profile.

    GET /api/v1/auth/me/
    PUT /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return success_response(data=serializer.data)

    def put(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserSerializer(request.user).data,
            message="Profile updated successfully.",
        )

    def patch(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserSerializer(request.user).data,
            message="Profile updated successfully.",
        )


class UserProfileView(APIView):
    """
    Manage user profile.

    GET /api/v1/auth/profile/
    PUT /api/v1/auth/profile/
    PATCH /api/v1/auth/profile/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user)
        return success_response(data=serializer.data)

    def put(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserProfileSerializer(request.user).data,
            message="Profile updated successfully.",
        )

    def patch(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=UserProfileSerializer(request.user).data,
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

    Full CRUD on staff accounts, only accessible by ADMIN role.
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
        if instance.id == self.request.user.id:
            from apps.core.exceptions import ConflictError
            raise ConflictError("Administrators cannot delete their own account.")
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
