"""
Serializers for accounts app — registration, authentication, password reset,
email verification, profiles, and administrative management.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import UserRole

User = get_user_model()
signer = TimestampSigner(salt="email-verification-salt")


class UserSerializer(serializers.ModelSerializer):
    """Public/standard representation of a user."""

    full_name = serializers.CharField(read_only=True)
    patient_id = serializers.SerializerMethodField()

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
            "is_email_verified",
            "patient_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "full_name",
            "is_email_verified",
            "patient_id",
        ]

    def get_patient_id(self, obj: User) -> str | None:
        if hasattr(obj, "patient_profile") and obj.patient_profile:
            return str(obj.patient_profile.id)
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role and profile metadata."""

    username = serializers.CharField(
        required=False,
        default="",
        allow_blank=True,
    )
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
    role = serializers.ChoiceField(
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        required=False,
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
        extra_kwargs = {
            "username": {"required": False},
        }

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        user_for_validation = User(
            email=attrs.get("email"),
            username=attrs.get("username"),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(attrs["password"], user=user_for_validation)

        if not attrs.get("username"):
            attrs["username"] = attrs["email"].split("@")[0]

        return attrs

    def create(self, validated_data: dict) -> User:
        from apps.patients.models import Patient

        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        role = validated_data.get("role", UserRole.PATIENT)

        user = User.objects.create_user(password=password, **validated_data)

        # If user registered as a patient, automatically create and link their Patient master record
        if role == UserRole.PATIENT:
            import datetime
            import random

            mrn = f"MRN-{datetime.date.today().year}-{random.randint(100000, 999999)}"
            Patient.objects.create(
                user=user,
                mrn=mrn,
                first_name=user.first_name or "Patient",
                last_name=user.last_name or user.username,
                date_of_birth=datetime.date(1990, 1, 1),
                phone_number=user.phone_number,
                email=user.email,
            )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Enhanced JWT obtain pair serializer.

    Adds clinical user claims to the JWT payload and returns user
    profile data alongside access & refresh tokens.
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
        token["is_clinician"] = user.is_clinician
        token["is_staff_member"] = user.is_staff_member
        token["is_patient"] = user.is_patient

        return token

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)

        patient_id = None
        if hasattr(self.user, "patient_profile") and self.user.patient_profile:
            patient_id = str(self.user.patient_profile.id)

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
            "is_email_verified": self.user.is_email_verified,
            "patient_id": patient_id,
        }

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for self-service profile updates and viewing."""

    patient_record = serializers.SerializerMethodField()

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
            "is_email_verified",
            "patient_record",
        ]
        read_only_fields = ["id", "email", "username", "role", "is_email_verified", "full_name", "patient_record"]

    def get_patient_record(self, obj: User) -> dict | None:
        if hasattr(obj, "patient_profile") and obj.patient_profile:
            p = obj.patient_profile
            return {
                "id": str(p.id),
                "mrn": p.mrn,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "date_of_birth": str(p.date_of_birth),
                "blood_group": p.blood_group,
                "gender": p.gender,
            }
        return None


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


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer to request a password reset email."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer to confirm password reset with cryptographic one-time token."""

    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})

        # Decode uid
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uidb64"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uidb64": "Invalid reset link or user does not exist."})

        # Verify token
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired password reset token."})

        # Validate password rules
        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs

    def save(self) -> User:
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class EmailVerificationRequestSerializer(serializers.Serializer):
    """Serializer to request email verification token."""

    email = serializers.EmailField(required=False)


class EmailVerificationConfirmSerializer(serializers.Serializer):
    """Serializer to confirm email verification token."""

    token = serializers.CharField(required=True)

    def validate_token(self, value: str) -> User:
        try:
            # 48 hours validity
            user_id = signer.unsign(value, max_age=48 * 3600)
            user = User.objects.get(pk=user_id)
            return user
        except SignatureExpired:
            raise serializers.ValidationError("Verification token has expired. Please request a new one.")
        except (BadSignature, User.DoesNotExist):
            raise serializers.ValidationError("Invalid verification token.")


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
            "is_email_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "full_name"]
