"""
Celery asynchronous tasks for Laya-MLX Typed Decisions.
Handles health polling, robustness testing, and benchmark execution.
"""
import logging
import time
from celery import shared_task
from django.utils import timezone
from integrations.laya_mlx.adapter import LayaMLXProvider
from integrations.laya_mlx.safety import TypedDecisionSafety
from .typed_decision_models import (
    TypedDecisionProvider,
    TypedDecisionSchema,
    TypedDecisionEvaluation,
    TypedDecisionAuditEvent,
    SchemaStatus,
)

logger = logging.getLogger("ai_orchestrator.typed_decision_tasks")


@shared_task(name="apps.ai_orchestrator.tasks.run_laya_health_check")
def run_laya_health_check_task():
    """
    Periodic or on-demand health check for Laya-MLX runtime.
    Updates authoritative Neon database status.
    """
    provider = LayaMLXProvider()
    health = provider.health_check()
    
    db_provider, _ = TypedDecisionProvider.objects.get_or_create(
        name="laya-mlx",
        defaults={"display_name": "Laya-MLX Native Runtime"}
    )
    db_provider.platform_supported = health.get("platform_supported", False)
    db_provider.health_status = health.get("health", "UNAVAILABLE")
    db_provider.capabilities_metadata = health
    db_provider.save()

    TypedDecisionAuditEvent.objects.create(
        action="HEALTH_CHECK_COMPLETED",
        actor_role="CELERY_WORKER",
        target_identifier="laya-mlx",
        details=health,
    )
    return health


@shared_task(name="apps.ai_orchestrator.tasks.run_schema_robustness_test")
def run_schema_robustness_test_task(schema_id: str, sample_context: str):
    """
    Asynchronous option-order robustness test for a typed decision schema.
    """
    try:
        schema = TypedDecisionSchema.objects.get(id=schema_id)
    except TypedDecisionSchema.DoesNotExist:
        logger.error(f"Schema {schema_id} not found for robustness test.")
        return {"error": "Schema not found"}

    provider = LayaMLXProvider()

    def predict_proxy(ctx, instructions, options):
        return provider.predict_choice(ctx, instructions, options)

    result = TypedDecisionSafety.evaluate_permutation_robustness(
        predict_proxy,
        sample_context,
        schema.instructions,
        schema.allowed_options,
    )

    schema.robustness_status = result["status"]
    schema.robustness_score = result["robustness_score"]
    if result["status"] == "ROBUSTNESS_FAILED" and schema.status in (SchemaStatus.APPROVED, SchemaStatus.ACTIVE):
        schema.status = SchemaStatus.SUSPENDED
    schema.save()

    TypedDecisionEvaluation.objects.create(
        schema=schema,
        sample_size=result["permutations_tested"],
        robustness_score=result["robustness_score"],
        passed_robustness=result["is_stable"],
        evaluation_details=result,
    )

    TypedDecisionAuditEvent.objects.create(
        action="ROBUSTNESS_TEST_COMPLETED",
        actor_role="CELERY_WORKER",
        target_identifier=f"{schema.name}:{schema.version}",
        details=result,
    )
    return result


@shared_task(name="apps.ai_orchestrator.tasks.run_laya_benchmark")
def run_laya_benchmark_task(iterations: int = 10):
    """
    Benchmark local Laya inference latency and memory profile.
    """
    provider = LayaMLXProvider()
    latencies = []
    sample_context = "Patient vitals: BP 120/80, HR 72, SpO2 98%. Clean context."
    sample_options = ["ROUTINE_REVIEW", "CLINICIAN_REVIEW", "HIGH_PRIORITY_REVIEW"]

    for _ in range(iterations):
        t0 = time.time()
        res = provider.predict_choice(sample_context, "Select workflow classification", sample_options)
        latencies.append(round((time.time() - t0) * 1000, 2))

    latencies.sort()
    p50 = latencies[len(latencies) // 2]
    p95 = latencies[int(len(latencies) * 0.95)] if len(latencies) >= 20 else latencies[-1]
    avg_latency = round(sum(latencies) / len(latencies), 2)

    benchmark_data = {
        "iterations": iterations,
        "average_latency_ms": avg_latency,
        "p50_latency_ms": p50,
        "p95_latency_ms": p95,
        "min_latency_ms": latencies[0],
        "max_latency_ms": latencies[-1],
        "platform_capabilities": provider.capabilities(),
    }

    TypedDecisionAuditEvent.objects.create(
        action="BENCHMARK_COMPLETED",
        actor_role="CELERY_WORKER",
        target_identifier="laya-mlx",
        details=benchmark_data,
    )
    return benchmark_data
