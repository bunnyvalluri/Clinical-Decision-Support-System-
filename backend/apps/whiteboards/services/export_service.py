"""
Whiteboard Export & Sanitization Service.
"""
from rest_framework.exceptions import ValidationError
from apps.whiteboards.models import ClinicalWhiteboard, WhiteboardAuditEvent
from apps.whiteboards.security import sanitize_svg_content


class WhiteboardExportService:
    """
    Handles sanitized exports and compliance auditing.
    """

    @classmethod
    def audit_export(
        cls,
        whiteboard: ClinicalWhiteboard,
        format_type: str,  # "JSON", "SVG", "PNG"
        user,
        ip_address: str = None,
        user_agent: str = "",
    ):
        fmt = format_type.upper()
        if fmt not in ["JSON", "SVG", "PNG"]:
            raise ValidationError(f"Unsupported export format: {format_type}")

        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action="EXPORT",
            version_number=whiteboard.current_version,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"format": fmt, "classification": whiteboard.classification},
        )

    @classmethod
    def sanitize_svg(cls, svg_content: str) -> str:
        return sanitize_svg_content(svg_content)
