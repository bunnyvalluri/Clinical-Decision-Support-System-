"""
Clinical Knowledge and Guideline Management Service — Prompt 64.
Provides authoritative lifecycle management, versioning, provenance tracking,
stale-knowledge detection, and evidence-linking for clinical guidelines and protocols.
Enforces that unapproved knowledge never silently appears as active recommendations.
"""
from datetime import date
import hashlib
import logging
from typing import Any, Dict, List, Optional
from django.db import transaction
from django.utils import timezone

from apps.clinical.models import (
    ClinicalKnowledgeDocument,
    ClinicalKnowledgeVersion,
    EvidenceReference,
    EvidenceSource,
    Guideline,
    GuidelineVersion,
)
from apps.core.models import AuditLog
from services.base import BaseService

logger = logging.getLogger("clinical.knowledge_service")


class ClinicalKnowledgeService(BaseService):
    """
    Authoritative service for managing clinical knowledge documents, guidelines,
    version history, provenance, and stale knowledge audits.
    """

    @transaction.atomic
    def create_document(
        self,
        document_id: str,
        title: str,
        content: str,
        organization: str,
        created_by: Any,
        document_type: str = ClinicalKnowledgeDocument.DocumentType.GUIDELINE,
        jurisdiction: str = "GLOBAL",
        specialty: str = "GENERAL_MEDICINE",
        summary: str = "",
        initial_version: str = "1.0.0",
        effective_date: Optional[date] = None,
        review_date: Optional[date] = None,
        evidence_source: Optional[EvidenceSource] = None,
        provenance: Optional[Dict[str, Any]] = None,
        status: str = ClinicalKnowledgeDocument.Status.DRAFT,
    ) -> ClinicalKnowledgeDocument:
        """
        Create a new clinical knowledge document with an initial immutable version record.
        """
        eff_date = effective_date or timezone.now().date()
        prov = provenance or {}
        if not prov.get("retrieved_date"):
            prov["retrieved_date"] = eff_date.isoformat()
        if not prov.get("content_hash"):
            prov["content_hash"] = hashlib.sha256(content.encode("utf-8")).hexdigest()
        if evidence_source:
            prov["source_name"] = evidence_source.name
            prov["verification_status"] = evidence_source.verification_status
        else:
            prov["verification_status"] = "SOURCE NOT VERIFIED"

        doc = ClinicalKnowledgeDocument.objects.create(
            document_id=document_id,
            title=title,
            document_type=document_type,
            organization=organization,
            jurisdiction=jurisdiction,
            specialty=specialty,
            summary=summary,
            content=content,
            status=status,
            current_version=initial_version,
            is_active=(status == ClinicalKnowledgeDocument.Status.APPROVED),
            created_by=created_by,
            effective_date=eff_date,
            review_date=review_date,
            evidence_source=evidence_source,
            provenance=prov,
        )

        # Create initial version snapshot
        ClinicalKnowledgeVersion.objects.create(
            document=doc,
            version=initial_version,
            previous_version="",
            status=status,
            content_snapshot=content,
            changed_fields=["initial_creation"],
            change_reason="Initial document creation.",
            reviewer=created_by,
            effective_date=eff_date,
            review_date=review_date,
        )

        AuditLog.objects.create(
            user=created_by,
            action=AuditLog.Action.CREATE,
            resource_type="ClinicalKnowledgeDocument",
            resource_id=str(doc.id),
            description=f"Created clinical knowledge document {document_id} (v{initial_version}) [{status}].",
            metadata={"document_id": document_id, "status": status, "version": initial_version},
        )

        return doc

    @transaction.atomic
    def revise_document(
        self,
        document_id: str,
        new_content: str,
        new_version: str,
        change_reason: str,
        author: Any,
        changed_fields: Optional[List[str]] = None,
        new_summary: Optional[str] = None,
        new_review_date: Optional[date] = None,
    ) -> ClinicalKnowledgeVersion:
        """
        Create a controlled revision for an existing clinical knowledge document.
        Never silently overwrites published knowledge.
        """
        doc = ClinicalKnowledgeDocument.objects.get(document_id=document_id)
        prev_version = doc.current_version
        fields_changed = changed_fields or ["content"]

        version_obj = ClinicalKnowledgeVersion.objects.create(
            document=doc,
            version=new_version,
            previous_version=prev_version,
            status=ClinicalKnowledgeDocument.Status.UNDER_REVIEW,
            content_snapshot=new_content,
            changed_fields=fields_changed,
            change_reason=change_reason,
            reviewer=author,
            effective_date=timezone.now().date(),
            review_date=new_review_date or doc.review_date,
        )

        # Update document current draft state
        doc.content = new_content
        doc.current_version = new_version
        doc.status = ClinicalKnowledgeDocument.Status.UNDER_REVIEW
        if new_summary is not None:
            doc.summary = new_summary
        if new_review_date:
            doc.review_date = new_review_date

        # Update provenance hash
        doc.provenance["content_hash"] = hashlib.sha256(new_content.encode("utf-8")).hexdigest()
        doc.provenance["last_revised_at"] = timezone.now().isoformat()
        doc.save(update_fields=["content", "current_version", "status", "summary", "review_date", "provenance", "updated_at"])

        AuditLog.objects.create(
            user=author,
            action=AuditLog.Action.UPDATE,
            resource_type="ClinicalKnowledgeDocument",
            resource_id=str(doc.id),
            description=f"Revised document {document_id} to v{new_version} from v{prev_version}. Reason: {change_reason}",
            metadata={"document_id": document_id, "prev_version": prev_version, "new_version": new_version},
        )

        return version_obj

    @transaction.atomic
    def approve_document(
        self,
        document_id: str,
        reviewer: Any,
        approval_event: str = "CLINICAL_BOARD_APPROVAL",
    ) -> ClinicalKnowledgeDocument:
        """
        Approve clinical knowledge document. Clinician / Informaticist approval gate.
        """
        doc = ClinicalKnowledgeDocument.objects.get(document_id=document_id)
        doc.status = ClinicalKnowledgeDocument.Status.APPROVED
        doc.reviewer = reviewer
        doc.is_active = True
        doc.save(update_fields=["status", "reviewer", "is_active", "updated_at"])

        # Also mark latest version as approved
        latest_ver = doc.versions.order_by("-created_at").first()
        if latest_ver:
            latest_ver.status = ClinicalKnowledgeDocument.Status.APPROVED
            latest_ver.approved_by = reviewer
            latest_ver.approval_event = approval_event
            latest_ver.save(update_fields=["status", "approved_by", "approval_event", "updated_at"])

        AuditLog.objects.create(
            user=reviewer,
            action=AuditLog.Action.UPDATE,
            resource_type="ClinicalKnowledgeDocument",
            resource_id=str(doc.id),
            description=f"Approved clinical knowledge document {document_id} (v{doc.current_version}). Event: {approval_event}.",
            metadata={"document_id": document_id, "approval_event": approval_event},
        )

        return doc

    @transaction.atomic
    def publish_document(
        self,
        document_id: str,
        user: Any,
    ) -> ClinicalKnowledgeDocument:
        """
        Publish approved clinical knowledge document.
        """
        doc = ClinicalKnowledgeDocument.objects.get(document_id=document_id)
        if doc.status != ClinicalKnowledgeDocument.Status.APPROVED:
            raise ValueError(f"Cannot publish document with status {doc.status}. Must be APPROVED first.")

        doc.status = ClinicalKnowledgeDocument.Status.PUBLISHED
        doc.is_active = True
        doc.save(update_fields=["status", "is_active", "updated_at"])

        latest_ver = doc.versions.order_by("-created_at").first()
        if latest_ver:
            latest_ver.status = ClinicalKnowledgeDocument.Status.PUBLISHED
            latest_ver.save(update_fields=["status", "updated_at"])

        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.UPDATE,
            resource_type="ClinicalKnowledgeDocument",
            resource_id=str(doc.id),
            description=f"Published clinical knowledge document {document_id} (v{doc.current_version}).",
            metadata={"document_id": document_id, "version": doc.current_version},
        )

        return doc

    @transaction.atomic
    def deprecate_document(
        self,
        document_id: str,
        user: Any,
        reason: str = "",
    ) -> ClinicalKnowledgeDocument:
        """
        Deprecate a clinical knowledge document so it is no longer used in active recommendations.
        """
        doc = ClinicalKnowledgeDocument.objects.get(document_id=document_id)
        doc.status = ClinicalKnowledgeDocument.Status.DEPRECATED
        doc.is_active = False
        doc.save(update_fields=["status", "is_active", "updated_at"])

        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.UPDATE,
            resource_type="ClinicalKnowledgeDocument",
            resource_id=str(doc.id),
            description=f"Deprecated document {document_id}. Reason: {reason}",
            metadata={"document_id": document_id, "reason": reason},
        )

        return doc

    def get_active_guidelines(
        self,
        specialty: Optional[str] = None,
        jurisdiction: Optional[str] = None,
    ) -> List[ClinicalKnowledgeDocument]:
        """
        Retrieve approved and published guidelines only.
        Never returns unapproved, draft, deprecated, or archived guidelines.
        """
        qs = ClinicalKnowledgeDocument.objects.filter(
            status__in=[
                ClinicalKnowledgeDocument.Status.APPROVED,
                ClinicalKnowledgeDocument.Status.PUBLISHED,
            ],
            is_active=True,
        ).select_related("evidence_source", "created_by", "reviewer").prefetch_related("evidence_references")

        if specialty:
            qs = qs.filter(specialty=specialty)
        if jurisdiction:
            qs = qs.filter(jurisdiction=jurisdiction)

        return list(qs)

    def detect_stale_knowledge(self) -> List[Dict[str, Any]]:
        """
        Audit all clinical guidelines and protocols for expiration / review due dates.
        If review_date <= today: flags REVIEW_REQUIRED.
        Does not automatically delete or republish.
        """
        today = timezone.now().date()
        stale_docs = ClinicalKnowledgeDocument.objects.filter(
            review_date__lte=today,
            is_active=True,
        ).exclude(status__in=[
            ClinicalKnowledgeDocument.Status.DEPRECATED,
            ClinicalKnowledgeDocument.Status.ARCHIVED,
        ])

        results = []
        for doc in stale_docs:
            results.append({
                "document_id": doc.document_id,
                "title": doc.title,
                "current_version": doc.current_version,
                "review_date": doc.review_date.isoformat() if doc.review_date else None,
                "status": doc.status,
                "organization": doc.organization,
                "specialty": doc.specialty,
                "days_overdue": (today - doc.review_date).days if doc.review_date else 0,
                "action_required": "REVIEW_REQUIRED",
            })
        return results

    def get_provenance_metadata(self, document_id: str) -> Dict[str, Any]:
        """
        Retrieve immutable provenance metadata for a guideline or document.
        Returns 'SOURCE NOT VERIFIED' if evidence information is absent.
        """
        try:
            doc = ClinicalKnowledgeDocument.objects.select_related("evidence_source").get(document_id=document_id)
        except ClinicalKnowledgeDocument.DoesNotExist:
            return {"error": "Document not found", "verification_status": "SOURCE NOT VERIFIED"}

        src = doc.evidence_source
        if not src or not src.is_verified:
            ver_status = "SOURCE NOT VERIFIED"
        else:
            ver_status = src.verification_status

        return {
            "document_id": doc.document_id,
            "title": doc.title,
            "version": doc.current_version,
            "organization": doc.organization,
            "jurisdiction": doc.jurisdiction,
            "specialty": doc.specialty,
            "status": doc.status,
            "effective_date": doc.effective_date.isoformat() if doc.effective_date else None,
            "review_date": doc.review_date.isoformat() if doc.review_date else None,
            "source": src.name if src else "SOURCE NOT VERIFIED",
            "source_url": src.source_url if src else None,
            "publisher": src.publisher if src else None,
            "publication_date": src.publication_date.isoformat() if src and src.publication_date else None,
            "trust_level": src.trust_level if src else "UNVERIFIED",
            "verification_status": ver_status,
            "provenance_raw": doc.provenance,
        }
