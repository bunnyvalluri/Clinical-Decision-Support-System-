"""
Whiteboard document persistence, versioning, hashing, and rollback.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.whiteboards.models import (
    ClinicalWhiteboard,
    WhiteboardDocument,
    WhiteboardAuditEvent,
)
from apps.whiteboards.validators import validate_excalidraw_document
from apps.whiteboards.security import scan_for_secrets, scan_for_unauthorized_phi


class WhiteboardPersistenceService:
    """
    Manages transactional save operations, version snapshots, and rollback restorations.
    """

    @classmethod
    @transaction.atomic
    def save_document(
        cls,
        whiteboard: ClinicalWhiteboard,
        elements: list,
        app_state: dict,
        files: dict,
        user=None,
        is_checkpoint: bool = False,
        checkpoint_summary: str = "",
        ip_address: str = None,
        user_agent: str = "",
    ) -> WhiteboardDocument:
        # Check if locked
        if whiteboard.is_locked:
            raise ValidationError("Whiteboard is locked by clinical approval and cannot be modified.")

        # 1. Validation & Theme enforcement
        elements, app_state, files = validate_excalidraw_document(elements, app_state, files)

        # 2. Security & PHI Scanning
        scan_for_secrets(elements)
        scan_for_unauthorized_phi(elements, whiteboard.classification)

        # 3. Calculate content hash and payload size
        content_hash = WhiteboardDocument.calculate_hash(elements, app_state, files)
        size_bytes = len(str(elements).encode("utf-8")) + len(str(files).encode("utf-8"))

        # Determine target version
        current_doc = (
            WhiteboardDocument.objects.filter(whiteboard=whiteboard)
            .order_by("-version_number")
            .first()
        )

        if is_checkpoint or not current_doc:
            target_version = (current_doc.version_number + 1) if current_doc else 1
            doc = WhiteboardDocument.objects.create(
                whiteboard=whiteboard,
                version_number=target_version,
                elements=elements,
                app_state=app_state,
                files=files,
                content_hash=content_hash,
                size_bytes=size_bytes,
                is_checkpoint=is_checkpoint,
                checkpoint_summary=checkpoint_summary or f"Version {target_version} checkpoint",
                created_by=user,
            )
            whiteboard.current_version = target_version
        else:
            # Update current active draft document
            doc = current_doc
            doc.elements = elements
            doc.app_state = app_state
            doc.files = files
            doc.content_hash = content_hash
            doc.size_bytes = size_bytes
            if checkpoint_summary:
                doc.checkpoint_summary = checkpoint_summary
            doc.save()

        # Update whiteboard timestamp
        whiteboard.updated_by = user
        whiteboard.save(update_fields=["current_version", "updated_by", "updated_at"])

        # Audit log
        action = "CHECKPOINT" if is_checkpoint else "AUTOSAVE"
        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action=action,
            version_number=doc.version_number,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "size_bytes": size_bytes,
                "element_count": len(elements),
                "content_hash": content_hash,
                "is_checkpoint": is_checkpoint,
            },
        )

        return doc

    @classmethod
    @transaction.atomic
    def restore_version(
        cls,
        whiteboard: ClinicalWhiteboard,
        target_version_number: int,
        user=None,
        reason: str = "",
        ip_address: str = None,
        user_agent: str = "",
    ) -> WhiteboardDocument:
        target_doc = WhiteboardDocument.objects.filter(
            whiteboard=whiteboard,
            version_number=target_version_number,
        ).first()

        if not target_doc:
            raise ValidationError(f"Target version {target_version_number} does not exist.")

        # Unlock whiteboard if locked
        if whiteboard.is_locked:
            whiteboard.is_locked = False
            whiteboard.locked_by = None
            whiteboard.locked_at = None

        new_version_num = whiteboard.current_version + 1
        new_doc = WhiteboardDocument.objects.create(
            whiteboard=whiteboard,
            version_number=new_version_num,
            elements=target_doc.elements,
            app_state=target_doc.app_state,
            files=target_doc.files,
            content_hash=target_doc.content_hash,
            size_bytes=target_doc.size_bytes,
            is_checkpoint=True,
            checkpoint_summary=f"Restored from version {target_version_number}. Reason: {reason or 'No reason provided'}",
            created_by=user,
        )

        whiteboard.current_version = new_version_num
        whiteboard.updated_by = user
        whiteboard.save()

        # Audit trail
        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action="RESTORE",
            version_number=new_version_num,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "restored_from_version": target_version_number,
                "new_version_number": new_version_num,
                "reason": reason,
            },
        )

        return new_doc
