"""
Role-based permission classes.

These permission classes plug into DRF's permission system and use the
``role`` field on the custom User model to grant or deny access.
"""
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import UserRole


class IsAdmin(BasePermission):
    """Grant access only to users with the ADMIN role."""

    message = "Administrator privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsDoctor(BasePermission):
    """Grant access only to users with the DOCTOR role."""

    message = "Doctor privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.DOCTOR
        )


class IsNurse(BasePermission):
    """Grant access only to users with the NURSE role."""

    message = "Nurse privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.NURSE
        )


class IsAnalyst(BasePermission):
    """Grant access only to users with the ANALYST role."""

    message = "Analyst privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ANALYST
        )


class IsAdminOrDoctor(BasePermission):
    """Grant access to ADMIN or DOCTOR roles."""

    message = "Administrator or Doctor privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.DOCTOR)
        )


class IsAdminOrDoctorOrNurse(BasePermission):
    """Grant access to ADMIN, DOCTOR, or NURSE roles."""

    message = "Clinical staff privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
        )


class IsClinicalStaffOrReadOnly(BasePermission):
    """
    Doctors and nurses can write; Analysts and Admins can read.
    All authenticated users can read (GET, HEAD, OPTIONS).
    """

    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.role in (UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
