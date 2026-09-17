"""
Postgres Fallback Search Service.
Executes safe, parameterized PostgreSQL searches when Meilisearch is unavailable,
guaranteeing that clinical workflows and patient triage are never disrupted.
"""
import logging
import time
from typing import Any, Dict, List, Optional
from django.db.models import Q
from .permissions import SearchPolicyService, ROLE_PATIENT, ROLE_USER
from .settings import (
    INDEX_PATIENTS,
    INDEX_PREDICTIONS,
    INDEX_CLINICAL_RECORDS,
    INDEX_MODELS,
    INDEX_WHITEBOARDS,
)

logger = logging.getLogger(__name__)


class PostgresFallbackSearchService:
    """Safe fallback search service operating against Neon PostgreSQL."""

    @classmethod
    def search(
        cls,
        user: Any,
        query: str,
        index_name: str,
        page: int = 1,
        limit: int = 20,
        filters_dict: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute fallback search for the requested index."""
        start_time = time.time()
        role = SearchPolicyService.normalize_role(user)

        # Enforce index authorization
        if not SearchPolicyService.can_search_index(user, index_name):
            return {
                "hits": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0,
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "search_mode": "degraded_postgres",
                "warning": "Unauthorized index requested.",
            }

        hits: List[Dict[str, Any]] = []
        total = 0

        offset = (page - 1) * limit

        try:
            if index_name == INDEX_PATIENTS:
                from apps.patients.models import Patient
                qs = Patient.objects.filter(is_deleted=False)
                if role in (ROLE_PATIENT, ROLE_USER):
                    qs = qs.filter(user_id=getattr(user, "id", None))

                if query:
                    qs = qs.filter(
                        Q(first_name__icontains=query)
                        | Q(last_name__icontains=query)
                        | Q(mrn__iexact=query)
                    )
                total = qs.count()
                records = qs[offset : offset + limit]
                for p in records:
                    hits.append({
                        "document_id": f"patient_{p.id}",
                        "entity_type": "patient",
                        "title": p.full_name,
                        "subtitle": f"MRN: {p.mrn} • {p.gender}",
                        "status": "ACTIVE" if p.is_active else "INACTIVE",
                        "updated_at": int(p.updated_at.timestamp()) if hasattr(p, "updated_at") and p.updated_at else int(time.time()),
                    })

            elif index_name == INDEX_PREDICTIONS:
                from apps.predictions.models import Prediction
                qs = Prediction.objects.select_related("patient").all()
                if role in (ROLE_PATIENT, ROLE_USER):
                    qs = qs.filter(patient__user_id=getattr(user, "id", None))

                if query:
                    qs = qs.filter(
                        Q(patient__mrn__iexact=query)
                        | Q(model_name__icontains=query)
                        | Q(prediction_result__iexact=query)
                    )
                total = qs.count()
                records = qs.order_by("-created_at")[offset : offset + limit]
                for pr in records:
                    hits.append({
                        "document_id": f"prediction_{pr.id}",
                        "entity_type": "prediction",
                        "title": f"Risk: {pr.prediction_result} ({float(pr.probability):.1%})",
                        "subtitle": f"Patient: {pr.patient.mrn} • Model: {pr.model_name}",
                        "risk_level": pr.prediction_result,
                        "updated_at": int(pr.created_at.timestamp()) if pr.created_at else int(time.time()),
                    })

            elif index_name == INDEX_MODELS:
                from apps.model_registry.models import ModelVersion
                qs = ModelVersion.objects.all()
                if query:
                    qs = qs.filter(Q(name__icontains=query) | Q(version__icontains=query) | Q(algorithm__icontains=query))
                total = qs.count()
                records = qs.order_by("-created_at")[offset : offset + limit]
                for m in records:
                    hits.append({
                        "document_id": f"model_{m.id}",
                        "entity_type": "model",
                        "title": f"{m.name} v{m.version}",
                        "subtitle": f"Algorithm: {m.algorithm} • ROC-AUC: {float(m.roc_auc or 0):.3f}",
                        "status": m.status,
                        "updated_at": int(m.created_at.timestamp()) if m.created_at else int(time.time()),
                    })

            elif index_name == INDEX_WHITEBOARDS:
                from apps.whiteboards.models import ClinicalWhiteboard
                qs = ClinicalWhiteboard.objects.all()
                if query:
                    qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))
                total = qs.count()
                records = qs.order_by("-updated_at")[offset : offset + limit]
                for wb in records:
                    hits.append({
                        "document_id": f"whiteboard_{wb.id}",
                        "entity_type": "whiteboard",
                        "title": wb.title,
                        "subtitle": f"Type: {wb.type} • Status: {wb.status}",
                        "status": wb.status,
                        "updated_at": int(wb.updated_at.timestamp()) if wb.updated_at else int(time.time()),
                    })

        except Exception as exc:
            logger.error("PostgresFallbackSearch error: %s", exc)

        total_pages = (total + limit - 1) // limit if limit > 0 else 1

        return {
            "hits": hits,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "search_mode": "degraded_postgres",
        }
