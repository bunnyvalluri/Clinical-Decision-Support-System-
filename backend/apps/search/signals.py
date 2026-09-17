"""
Django Model Signals for Search Outbox Events.
Captures entity creations, updates, and soft-deletions to maintain
eventual consistency with Meilisearch.
"""
import logging
from typing import Any
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import SearchOutboxEvent

logger = logging.getLogger(__name__)


def _record_outbox_event(entity_type: str, instance: Any, action: str = "UPSERT") -> None:
    """Safely record an outbox event in PostgreSQL."""
    try:
        instance_id = str(getattr(instance, "id", ""))
        if not instance_id:
            return

        # If entity has soft-delete attribute and was marked deleted
        if getattr(instance, "is_deleted", False):
            action = "DELETE"

        SearchOutboxEvent.objects.create(
            entity_type=entity_type,
            entity_id=instance_id,
            action=action,
        )
    except Exception as exc:
        logger.warning("Could not record search outbox event for %s: %s", entity_type, exc)


def register_search_signals():
    """Dynamically connect signal listeners to models."""
    try:
        from apps.patients.models import Patient
        post_save.connect(
            lambda sender, instance, **kw: _record_outbox_event("patient", instance, "UPSERT"),
            sender=Patient,
            weak=False,
        )
        post_delete.connect(
            lambda sender, instance, **kw: _record_outbox_event("patient", instance, "DELETE"),
            sender=Patient,
            weak=False,
        )
    except Exception:
        pass

    try:
        from apps.predictions.models import Prediction
        post_save.connect(
            lambda sender, instance, **kw: _record_outbox_event("prediction", instance, "UPSERT"),
            sender=Prediction,
            weak=False,
        )
    except Exception:
        pass

    try:
        from apps.clinical.models import ClinicalRecord
        post_save.connect(
            lambda sender, instance, **kw: _record_outbox_event("clinical_record", instance, "UPSERT"),
            sender=ClinicalRecord,
            weak=False,
        )
    except Exception:
        pass

    try:
        from apps.model_registry.models import ModelVersion
        post_save.connect(
            lambda sender, instance, **kw: _record_outbox_event("model_version", instance, "UPSERT"),
            sender=ModelVersion,
            weak=False,
        )
    except Exception:
        pass

    try:
        from apps.whiteboards.models import ClinicalWhiteboard
        post_save.connect(
            lambda sender, instance, **kw: _record_outbox_event("whiteboard", instance, "UPSERT"),
            sender=ClinicalWhiteboard,
            weak=False,
        )
    except Exception:
        pass


register_search_signals()
