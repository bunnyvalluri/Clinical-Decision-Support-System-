"""
Serializers for accounts app — registration, authentication, profiles, and management.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import UserRole

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public/standard representation of a clinical user."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "department",
            "phone_number",
            "profile_picture",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "full_name"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role and profile metadata."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
            "department",
            "phone_number",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Validate password strength against Django configured validators
        user_for_validation = User(
            email=attrs.get("email"),
            username=attrs.get("username"),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(attrs["password"], user=user_for_validation)

        # Default username to email prefix if not explicitly specified
        if not attrs.get("username"):
            attrs["username"] = attrs["email"].split("@")[0]

        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Enhanced JWT obtain pair serializer.

    Adds clinical user claims to the JWT payload and returns user
    profile data alongside access & refresh tokens for frontend consumption.
    """

    username_field = "email"

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)

        # Custom claims embedded in the JWT payload
        token["email"] = user.email
        token["role"] = user.role
        token["full_name"] = user.full_name
        token["department"] = user.department
        token["is_admin"] = user.is_admin

        return token

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)

        # Include user profile directly in the login response
        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "username": self.user.username,
            "full_name": self.user.full_name,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": self.user.role,
            "department": self.user.department,
            "phone_number": self.user.phone_number,
        }

        return data


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for self-service profile updates."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "department",
            "profile_picture",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for authenticated password change requests."""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})

        user = self.context["request"].user
        validate_password(attrs["new_password"], user=user)

        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "New password cannot be the same as the current password."}
            )

        return attrs

    def save(self) -> User:
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class AdminUserManagementSerializer(serializers.ModelSerializer):
    """Serializer for administrative user management (CRUD + role modifications)."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "department",
            "phone_number",
            "is_active",
            "is_staff",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "full_name"]
