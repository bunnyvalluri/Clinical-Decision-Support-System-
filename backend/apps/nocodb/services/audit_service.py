"""
Audit logging service for NocoDB Healthcare Analytics workspace.
"""
from apps.nocodb.models import NocoDBAuditEvent, AuditAction
from apps.nocodb.permissions import normalize_role


def log_nocodb_audit_event(
    action: str,
    dataset_slug: str,
    user=None,
    resource_id: str = "",
    details: dict = None,
    request=None,
) -> NocoDBAuditEvent:
    """
    Creates an immutable audit event in Neon PostgreSQL.
    """
    user_obj = None
    role = "system"
    ip = None
    ua = ""

    if request:
        if getattr(request, "user", None) and request.user.is_authenticated:
            user_obj = request.user
            role = normalize_role(getattr(request.user, "role", ""))
        # Extract IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")
        ua = request.META.get("HTTP_USER_AGENT", "")[:500]
    elif user and getattr(user, "is_authenticated", False):
        user_obj = user
        role = normalize_role(getattr(user, "role", ""))

    return NocoDBAuditEvent.objects.create(
        user=user_obj,
        user_role=role,
        action=action,
        dataset_slug=dataset_slug,
        resource_id=str(resource_id)[:128],
        details=details or {},
        ip_address=ip,
        user_agent=ua,
    )
