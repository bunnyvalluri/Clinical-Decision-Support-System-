"""
Celery Background Tasks for Search Platform.
Executes asynchronous projection indexing, outbox processing,
zero-downtime reindexing, and periodic index reconciliation.
"""
import logging
from celery import shared_task
from django.utils import timezone
from integrations.meilisearch.client import get_meilisearch_client
from integrations.meilisearch.document_builder import SearchProjectionService
from integrations.meilisearch.governance import SearchDataGovernanceService
from integrations.meilisearch.index_manager import get_index_manager, INDEX_CONFIGS
from integrations.meilisearch.settings import (
    ALL_INDEXES,
    INDEX_PATIENTS,
    INDEX_PREDICTIONS,
    INDEX_CLINICAL_RECORDS,
    INDEX_MODELS,
    INDEX_WHITEBOARDS,
)
from .models import (
    SearchIndexRegistry,
    SearchIndexStatus,
    SearchOutboxEvent,
    OutboxEventStatus,
)

logger = logging.getLogger(__name__)


@shared_task(name="apps.search.tasks.process_search_outbox_task")
def process_search_outbox_task(batch_size: int = 100) -> int:
    """
    Process pending SearchOutboxEvent items and update Meilisearch idempotently.
    """
    client = get_meilisearch_client()
    if not client.is_available():
        logger.warning("Meilisearch unavailable; skipping outbox processing run.")
        return 0

    pending = SearchOutboxEvent.objects.filter(status=OutboxEventStatus.PENDING).order_by("created_at")[:batch_size]
    processed_count = 0

    for event in pending:
        event.status = OutboxEventStatus.PROCESSING
        event.save(update_fields=["status"])
        try:
            entity_type = event.entity_type.lower()
            entity_id = event.entity_id

            if event.action == "DELETE":
                # Propagate deletion
                target_index = entity_type + "s"
                doc_id = f"{entity_type}_{entity_id}"
                SearchDataGovernanceService.propagate_deletion(target_index, doc_id)
            else:
                # Upsert projection
                instance = _fetch_entity_instance(entity_type, entity_id)
                if instance:
                    doc = SearchProjectionService.build_document_for_entity(entity_type, instance)
                    if doc:
                        idx_name = _resolve_index_name(entity_type)
                        idx = client.raw_client.index(idx_name)
                        idx.add_documents([doc], primary_key="document_id")

            event.status = OutboxEventStatus.PROCESSED
            event.processed_at = timezone.now()
            event.save(update_fields=["status", "processed_at"])
            processed_count += 1
        except Exception as exc:
            logger.error("Failed processing search outbox event %s: %s", event.id, exc)
            event.status = OutboxEventStatus.FAILED
            event.retry_count += 1
            event.error_message = str(exc)[:500]
            event.save(update_fields=["status", "retry_count", "error_message"])

    return processed_count


@shared_task(name="apps.search.tasks.index_entity_task")
def index_entity_task(entity_type: str, entity_id: str) -> bool:
    """Idempotently index a single entity in Meilisearch."""
    client = get_meilisearch_client()
    if not client.is_available():
        return False

    instance = _fetch_entity_instance(entity_type.lower(), entity_id)
    if not instance:
        return False

    doc = SearchProjectionService.build_document_for_entity(entity_type.lower(), instance)
    if not doc:
        return False

    idx_name = _resolve_index_name(entity_type.lower())
    try:
        client.raw_client.index(idx_name).add_documents([doc], primary_key="document_id")
        return True
    except Exception as exc:
        logger.error("Error indexing %s:%s: %s", entity_type, entity_id, exc)
        return False


@shared_task(name="apps.search.tasks.reindex_all_search_task")
def reindex_all_search_task(target_index: str = "") -> dict:
    """
    Rebuild search indexes directly from authoritative Neon PostgreSQL records.
    """
    client = get_meilisearch_client()
    if not client.is_available():
        return {"status": "error", "message": "Meilisearch unavailable."}

    manager = get_index_manager()
    manager.setup_all_indexes()

    indexes_to_process = [target_index] if target_index else [
        INDEX_PATIENTS,
        INDEX_PREDICTIONS,
        INDEX_CLINICAL_RECORDS,
        INDEX_MODELS,
        INDEX_WHITEBOARDS,
    ]

    results = {}
    for idx_name in indexes_to_process:
        results[idx_name] = _reindex_single_dataset(client, idx_name)

    return {"status": "success", "results": results}


@shared_task(name="apps.search.tasks.search_index_reconciliation_task")
def search_index_reconciliation_task() -> dict:
    """
    Periodic comparison of PostgreSQL row counts vs Meilisearch document counts.
    Detects drift, updates registry, and reports discrepancies.
    """
    client = get_meilisearch_client()
    report = {}
    if not client.is_available():
        return {"status": "skipped", "reason": "Meilisearch unavailable."}

    stats = client.get_stats().get("indexes", {})

    models_map = {
        INDEX_PATIENTS: ("apps.patients.models", "Patient"),
        INDEX_PREDICTIONS: ("apps.predictions.models", "Prediction"),
        INDEX_CLINICAL_RECORDS: ("apps.clinical.models", "ClinicalRecord"),
        INDEX_MODELS: ("apps.model_registry.models", "ModelVersion"),
        INDEX_WHITEBOARDS: ("apps.whiteboards.models", "ClinicalWhiteboard"),
    }

    for idx_name, (mod_path, cls_name) in models_map.items():
        try:
            import importlib
            mod = importlib.import_module(mod_path)
            model_cls = getattr(mod, cls_name)

            # Count non-deleted records
            if hasattr(model_cls, "is_deleted"):
                neon_count = model_cls.objects.filter(is_deleted=False).count()
            else:
                neon_count = model_cls.objects.count()

            meili_stat = stats.get(idx_name, {})
            meili_count = meili_stat.get("numberOfDocuments", 0)
            drift = abs(neon_count - meili_count)

            reg, _ = SearchIndexRegistry.objects.get_or_create(
                index_uid=idx_name,
                defaults={"entity_type": idx_name.rstrip("s")},
            )
            reg.document_count = meili_count
            reg.last_reconciliation = timezone.now()
            reg.status = SearchIndexStatus.ACTIVE if drift <= 5 else SearchIndexStatus.DEGRADED
            reg.save(update_fields=["document_count", "last_reconciliation", "status"])

            report[idx_name] = {
                "neon_count": neon_count,
                "meilisearch_count": meili_count,
                "drift": drift,
                "status": reg.status,
            }
        except Exception as exc:
            logger.error("Reconciliation failed for index %s: %s", idx_name, exc)
            report[idx_name] = {"error": str(exc)}

    return report


def _fetch_entity_instance(entity_type: str, entity_id: str):
    """Dynamically load entity instance by type and ID."""
    try:
        if entity_type == "patient":
            from apps.patients.models import Patient
            return Patient.objects.filter(id=entity_id, is_deleted=False).first()
        elif entity_type == "prediction":
            from apps.predictions.models import Prediction
            return Prediction.objects.filter(id=entity_id).first()
        elif entity_type == "clinical_record":
            from apps.clinical.models import ClinicalRecord
            return ClinicalRecord.objects.filter(id=entity_id, is_deleted=False).first()
        elif entity_type in ("model", "model_version"):
            from apps.model_registry.models import ModelVersion
            return ModelVersion.objects.filter(id=entity_id).first()
        elif entity_type in ("whiteboard", "clinical_whiteboard"):
            from apps.whiteboards.models import ClinicalWhiteboard
            return ClinicalWhiteboard.objects.filter(id=entity_id).first()
    except Exception as exc:
        logger.warning("Could not fetch %s:%s: %s", entity_type, entity_id, exc)
    return None


def _resolve_index_name(entity_type: str) -> str:
    """Map entity type to standard index UID."""
    mapping = {
        "patient": INDEX_PATIENTS,
        "clinical_record": INDEX_CLINICAL_RECORDS,
        "prediction": INDEX_PREDICTIONS,
        "model": INDEX_MODELS,
        "model_version": INDEX_MODELS,
        "whiteboard": INDEX_WHITEBOARDS,
        "clinical_whiteboard": INDEX_WHITEBOARDS,
    }
    return mapping.get(entity_type, entity_type + "s")


def _reindex_single_dataset(client, index_name: str) -> int:
    """Bulk ingest records for a single index."""
    batch = []
    count = 0
    try:
        if index_name == INDEX_PATIENTS:
            from apps.patients.models import Patient
            for p in Patient.objects.filter(is_deleted=False):
                batch.append(SearchProjectionService.build_patient_document(p))
        elif index_name == INDEX_PREDICTIONS:
            from apps.predictions.models import Prediction
            for pr in Prediction.objects.select_related("patient").all()[:1000]:
                batch.append(SearchProjectionService.build_prediction_document(pr))
        elif index_name == INDEX_MODELS:
            from apps.model_registry.models import ModelVersion
            for m in ModelVersion.objects.all():
                batch.append(SearchProjectionService.build_model_document(m))

        if batch:
            idx = client.raw_client.index(index_name)
            idx.add_documents(batch, primary_key="document_id")
            count = len(batch)
    except Exception as exc:
        logger.error("Failed bulk reindex of %s: %s", index_name, exc)
    return count
