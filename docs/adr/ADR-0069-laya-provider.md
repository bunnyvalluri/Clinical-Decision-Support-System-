# ADR-0069: Integration of Laya as a Controlled Multilingual Typed-Decision Provider

## Status
Accepted

## Context
HealthNova AI serves diverse clinical contexts requiring multilingual triage routing, data-quality classification, and operational prioritization across Indic languages (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi) and English.

The upstream repository `https://github.com/NandhaKishorM/laya.git` (Convai Innovations, Apache-2.0) introduces modern typed decision concepts (`choice`, `score`, `noul`) alongside multilingual capability (`convaiinnovations/laya-multilingual`).

However:
1. **Primary Clinical ML Invariant:** Laya is an auxiliary workflow classifier and MUST NOT replace HealthNova's primary clinical risk prediction models (SVM, Random Forest, AdaBoost, SHAP, Clinical Knowledge Engine).
2. **Multilingual Script Sensitivity:** English ModernBERT collapses on non-Latin scripts (Hindi: 0.100, Tamil: 0.113), creating deceptive high confidence on random outputs. Language detection and script routing to `convaiinnovations/laya-multilingual` are mandatory.
3. **No Unvalidated Quality Claims:** Non-evaluated languages must be explicitly displayed as `NOT EVALUATED`. No fake accuracy or confidence scores can be fabricated.
4. **Single Abstraction:** Laya must not duplicate Prompt 68 (Laya-MLX). Both must unify under `TypedDecisionGateway` and `TypedDecisionProvider`. Application code must never import `laya` directly.

## Decision
1. **Auxiliary Role:** Laya is approved strictly as an auxiliary typed-decision provider behind the AI Safety Gateway. AI never diagnoses or prescribes autonomously; every clinical recommendation requires human clinician sign-off.
2. **Unified Common Abstraction:** Implemented `TypedDecisionGateway` managing `LayaProvider` (PyTorch/Transformers, Multilingual) and `LayaMLXProvider` (Apple Silicon MLX).
3. **Pure-Python Script Router:** Implemented `LayaLanguageRouter` with Unicode script inspection to automatically route Indic text (Devanagari, Telugu, Tamil, etc.) to `convaiinnovations/laya-multilingual` and Latin text to `convaiinnovations/laya`.
4. **Database-Backed Provenance & Evaluation:** Model checkpoints, schema definitions, audit logs, and language evaluations are recorded in Neon PostgreSQL (`typed_decision_language_evaluations`).
5. **Operational Kill Switch & Failover:** Configurable via `LAYA_ENABLED=false` and audited fallback between providers.

## Consequences
- **Positive:** Enables accurate, script-routed multilingual workflow classifications; transparent evaluation tracking in Informaticist AI Evaluation Center; zero destabilization to existing ML models or database.
- **Negative:** Requires PyTorch and Transformers on inference nodes; unevaluated languages require separate empirical clinical validation before active clinical production deployment.
