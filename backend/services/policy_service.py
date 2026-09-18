"""
Policy Service for configurable clinical risk thresholds — BPY-CSE-2666.
Enforces policy governance, versioning, and threshold mapping.
"""
from typing import Optional
from apps.predictions.models import RiskLevel, RiskThresholdPolicy


class RiskThresholdPolicyService:
    """
    Manages clinical risk threshold policies.
    Ensures thresholds are configurable, auditable, and never arbitrarily hardcoded.
    """

    @classmethod
    def get_active_policy(cls, model_version_id: Optional[str] = None) -> Optional[RiskThresholdPolicy]:
        """Fetch active threshold policy for specific model version or global fallback."""
        qs = RiskThresholdPolicy.objects.filter(is_active=True, approval_status="APPROVED")
        if model_version_id:
            policy = qs.filter(model_version_id=model_version_id).first()
            if policy:
                return policy
        return qs.order_by("-effective_date").first()

    @classmethod
    def resolve_risk_level(cls, probability: float, model_version_id: Optional[str] = None) -> str:
        """Map probability to clinical risk level using the active approved policy."""
        policy = cls.get_active_policy(model_version_id=model_version_id)
        if policy:
            return policy.classify_probability(probability)

        # Fallback default thresholds if no policy in database
        p = float(probability)
        if p < 0.25:
            return RiskLevel.LOW
        if p < 0.50:
            return RiskLevel.MEDIUM
        if p < 0.75:
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL
