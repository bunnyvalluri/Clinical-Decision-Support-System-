"""
Whiteboard lifecycle management, clinical review workflows, and sharing.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.accounts.models import UserRole
from apps.whiteboards.models import (
    ClinicalWhiteboard,
    WhiteboardDocument,
    WhiteboardShare,
    WhiteboardAuditEvent,
    WhiteboardStatus,
    DataClassification,
)
from apps.whiteboards.validators import validate_excalidraw_document


class WhiteboardService:
    """
    High-level business service for Clinical Whiteboard domain logic.
    """

    @classmethod
    @transaction.atomic
    def create_whiteboard(
        cls,
        title: str,
        owner,
        whiteboard_type: str = "GENERAL",
        classification: str = "INTERNAL",
        description: str = "",
        patient=None,
        tags: list = None,
        metadata: dict = None,
        initial_elements: list = None,
        initial_app_state: dict = None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> ClinicalWhiteboard:
        # Enforce PHI classification if patient is linked
        if patient is not None:
            classification = DataClassification.PHI

        whiteboard = ClinicalWhiteboard.objects.create(
            title=title,
            description=description,
            type=whiteboard_type,
            classification=classification,
            status=WhiteboardStatus.DRAFT,
            owner=owner,
            created_by=owner,
            updated_by=owner,
            patient=patient,
            tags=tags or [],
            metadata=metadata or {},
            current_version=1,
        )

        elements = initial_elements or []
        app_state = initial_app_state or {"viewBackgroundColor": "#ffffff", "theme": "light"}
        files = {}

        elements, app_state, files = validate_excalidraw_document(elements, app_state, files)
        content_hash = WhiteboardDocument.calculate_hash(elements, app_state, files)

        doc = WhiteboardDocument.objects.create(
            whiteboard=whiteboard,
            version_number=1,
            elements=elements,
            app_state=app_state,
            files=files,
            content_hash=content_hash,
            size_bytes=len(str(elements).encode("utf-8")),
            is_checkpoint=True,
            checkpoint_summary="Initial document creation (v1)",
            created_by=owner,
        )

        # Audit event
        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=owner,
            user_role=getattr(owner, "role", ""),
            action="CREATE",
            version_number=1,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "title": title,
                "type": whiteboard_type,
                "classification": classification,
                "patient_id": str(patient.id) if patient else None,
            },
        )

        return whiteboard

    @classmethod
    @transaction.atomic
    def perform_clinical_review(
        cls,
        whiteboard: ClinicalWhiteboard,
        action: str,  # "SUBMIT", "APPROVE", "REQUEST_CHANGES", "ARCHIVE"
        reviewer,
        notes: str = "",
        ip_address: str = None,
        user_agent: str = "",
    ) -> ClinicalWhiteboard:
        role = getattr(reviewer, "role", "")

        if action == "SUBMIT":
            whiteboard.status = WhiteboardStatus.IN_REVIEW
            whiteboard.review_notes = notes
            whiteboard.save(update_fields=["status", "review_notes", "updated_at"])
            audit_action = "REVIEW_SUBMIT"

        elif action == "APPROVE":
            # Only doctors/admins can approve
            if role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
                raise ValidationError("Only authorized physicians/clinicians can approve clinical whiteboards.")

            whiteboard.status = WhiteboardStatus.APPROVED
            whiteboard.is_locked = True
            whiteboard.locked_by = reviewer
            whiteboard.locked_at = timezone.now()
            whiteboard.clinical_reviewer = reviewer
            whiteboard.reviewed_at = timezone.now()
            whiteboard.review_notes = notes
            whiteboard.save()
            audit_action = "REVIEW_APPROVE"

        elif action == "REQUEST_CHANGES":
            whiteboard.status = WhiteboardStatus.DRAFT
            whiteboard.is_locked = False
            whiteboard.locked_by = None
            whiteboard.locked_at = None
            whiteboard.clinical_reviewer = reviewer
            whiteboard.reviewed_at = timezone.now()
            whiteboard.review_notes = notes
            whiteboard.save()
            audit_action = "REVIEW_REJECT"

        elif action == "ARCHIVE":
            whiteboard.status = WhiteboardStatus.ARCHIVED
            whiteboard.is_locked = True
            whiteboard.save()
            audit_action = "ARCHIVE"
        else:
            raise ValidationError(f"Unknown review action: {action}")

        # Immutable audit trail
        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=reviewer,
            user_role=role,
            action=audit_action,
            version_number=whiteboard.current_version,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"action": action, "notes": notes},
        )

        return whiteboard

    @classmethod
    def create_share(
        cls,
        whiteboard: ClinicalWhiteboard,
        user,
        target_role: str = "",
        target_user=None,
        allow_edit: bool = False,
        expires_in_hours: int = 48,
        ip_address: str = None,
        user_agent: str = "",
    ) -> WhiteboardShare:
        token = WhiteboardShare.generate_token()
        expires_at = timezone.now() + timezone.timedelta(hours=expires_in_hours) if expires_in_hours > 0 else None

        share = WhiteboardShare.objects.create(
            whiteboard=whiteboard,
            share_token=token,
            target_role=target_role,
            target_user=target_user,
            allow_edit=allow_edit,
            created_by=user,
            expires_at=expires_at,
        )

        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action="SHARE",
            version_number=whiteboard.current_version,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "share_id": str(share.id),
                "target_role": target_role,
                "target_user": str(target_user.id) if target_user else None,
                "allow_edit": allow_edit,
                "expires_at": expires_at.isoformat() if expires_at else None,
            },
        )

        return share

    @classmethod
    def revoke_share(
        cls,
        share: WhiteboardShare,
        user,
        ip_address: str = None,
        user_agent: str = "",
    ):
        share.is_revoked = True
        share.revoked_at = timezone.now()
        share.save(update_fields=["is_revoked", "revoked_at"])

        WhiteboardAuditEvent.objects.create(
            whiteboard=share.whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action="REVOKE_SHARE",
            version_number=share.whiteboard.current_version,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"share_id": str(share.id)},
        )
