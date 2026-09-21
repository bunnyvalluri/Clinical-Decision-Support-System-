"""
FHIR Provenance Tracker — BPY-CSE-2666.
Maintains cryptographically verifiable clinical data lineage and tracks originating healthcare sources.
"""
import hashlib
import json
from typing import Any, Dict, Optional
from django.utils import timezone

from apps.clinical.models import PatientTimelineEvent
from apps.interoperability.domain.enums import SyncDirection
from apps.interoperability.models import FHIREndpoint, FHIRProvenanceRecord, FHIRSyncJob


class ProvenanceTracker:
    """
    Computes cryptographic hashes and writes immutable provenance records
    for all imported and exported clinical entities.
    """

    @staticmethod
    def compute_payload_hash(payload: Any) -> str:
        """Compute SHA-256 checksum over deterministic JSON string representation."""
        canonical_json = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

    @classmethod
    def record_inbound_provenance(
        cls,
        entity_type: str,
        entity_id: str,
        fhir_resource: Dict[str, Any],
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        patient_id: Optional[str] = None,
    ) -> FHIRProvenanceRecord:
        """Create an immutable provenance record for an ingested external resource."""
        payload_hash = cls.compute_payload_hash(fhir_resource)
        resource_type = fhir_resource.get("resourceType", entity_type)
        external_id = str(fhir_resource.get("id") or "")
        external_version = str(fhir_resource.get("meta", {}).get("versionId", ""))
        sys_name = endpoint.name if endpoint else "External FHIR Source"

        prov = FHIRProvenanceRecord.objects.create(
            entity_type=entity_type,
            entity_id=str(entity_id),
            external_system=endpoint,
            external_system_name=sys_name,
            external_resource_id=external_id,
            external_version_id=external_version,
            fhir_resource_type=resource_type,
            payload_sha256=payload_hash,
            raw_payload_snapshot=fhir_resource,
            direction=SyncDirection.INBOUND_IMPORT,
            sync_job=sync_job,
            recorded_at=timezone.now(),
        )

        # Emit to unified Patient Timeline if patient linked
        if patient_id:
            try:
                PatientTimelineEvent.objects.create(
                    patient_id=patient_id,
                    event_type=PatientTimelineEvent.EventType.AUDIT_EVENT,
                    title=f"FHIR R4 Ingestion: {resource_type}",
                    description=f"Ingested {resource_type} from {sys_name} (Ext ID: {external_id}). SHA-256: {payload_hash[:12]}...",
                    actor=sys_name,
                    source="FHIR_Interoperability",
                    severity="NORMAL",
                    provenance={
                        "provenance_id": str(prov.id),
                        "sha256": payload_hash,
                        "external_id": external_id,
                        "resource_type": resource_type,
                    },
                )
            except Exception:
                pass  # Non-fatal if timeline emission fails

        return prov

    @classmethod
    def record_outbound_provenance(
        cls,
        entity_type: str,
        entity_id: str,
        fhir_resource: Dict[str, Any],
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
    ) -> FHIRProvenanceRecord:
        """Create an immutable provenance record for an exported internal entity."""
        payload_hash = cls.compute_payload_hash(fhir_resource)
        resource_type = fhir_resource.get("resourceType", entity_type)
        sys_name = endpoint.name if endpoint else "HealthNova AI Authoritative Store"

        return FHIRProvenanceRecord.objects.create(
            entity_type=entity_type,
            entity_id=str(entity_id),
            external_system=endpoint,
            external_system_name=sys_name,
            external_resource_id=str(fhir_resource.get("id") or entity_id),
            fhir_resource_type=resource_type,
            payload_sha256=payload_hash,
            raw_payload_snapshot=fhir_resource,
            direction=SyncDirection.OUTBOUND_EXPORT,
            sync_job=sync_job,
            recorded_at=timezone.now(),
        )

    @classmethod
    def build_fhir_provenance_resource(cls, provenance_record: FHIRProvenanceRecord) -> Dict[str, Any]:
        """Generate a standard FHIR R4 Provenance resource representing this record."""
        return {
            "resourceType": "Provenance",
            "id": f"prov-{provenance_record.id}",
            "target": [
                {
                    "reference": f"{provenance_record.fhir_resource_type}/{provenance_record.entity_id}",
                }
            ],
            "recorded": provenance_record.recorded_at.isoformat(),
            "reason": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                            "code": "CLINNOTEE",
                            "display": "clinical note entry",
                        }
                    ]
                }
            ],
            "agent": [
                {
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                "code": "author",
                                "display": "Author",
                            }
                        ]
                    },
                    "who": {
                        "display": provenance_record.external_system_name,
                    },
                }
            ],
            "signature": [
                {
                    "type": [
                        {
                            "system": "urn:iso-astm:E1762-95:2013",
                            "code": "1.2.840.10065.1.12.1.1",
                            "display": "Author's Signature",
                        }
                    ],
                    "when": provenance_record.recorded_at.isoformat(),
                    "data": provenance_record.payload_sha256,
                }
            ],
        }
