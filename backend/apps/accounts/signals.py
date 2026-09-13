"""
Accounts app signals — auditing login, logout, and security events.
"""
import logging

from django.contrib.auth import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

from apps.core.models import AuditLog

logger = logging.getLogger("apps.accounts")


def get_client_ip(request) -> str | None:
    """Extract client IP address considering reverse proxies."""
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs) -> None:
    """Record successful authentication in AuditLog."""
    try:
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""
        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.LOGIN,
            resource_type="User",
            resource_id=str(user.id),
            description=f"User {user.email} [{user.role}] logged in successfully.",
            ip_address=ip,
            user_agent=ua,
            metadata={"email": user.email, "role": user.role, "status": "success"},
        )
    except Exception as exc:
        logger.error("Failed to write audit log for user login: %s", exc)


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs) -> None:
    """Record user logout in AuditLog."""
    if not user:
        return
    try:
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""
        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.LOGOUT,
            resource_type="User",
            resource_id=str(user.id),
            description=f"User {user.email} logged out.",
            ip_address=ip,
            user_agent=ua,
            metadata={"email": user.email, "status": "logout"},
        )
    except Exception as exc:
        logger.error("Failed to write audit log for user logout: %s", exc)


@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs) -> None:
    """Record failed login attempt for security monitoring."""
    try:
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""
        attempted_email = credentials.get("email") or credentials.get("username") or "unknown"
        AuditLog.objects.create(
            user=None,
            action=AuditLog.Action.LOGIN,
            resource_type="User",
            resource_id=attempted_email,
            description=f"Failed login attempt for {attempted_email}.",
            ip_address=ip,
            user_agent=ua,
            metadata={"attempted_credential": attempted_email, "status": "failed"},
        )
    except Exception as exc:
        logger.error("Failed to write audit log for failed login: %s", exc)
