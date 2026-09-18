# Clinical Risk Engine & Predictive Architecture — BPY-CSE-2666

## Overview
The `RiskPredictionEngine` coordinates real-time clinical risk inference, multi-class probabilities, deterministic physiological safety overrides, out-of-distribution (OOD) quality checks, and TreeSHAP explainability attributions.

## Invariant Principles
1. **Configurable Thresholds (`RiskThresholdPolicy`):** Risk tiers (LOW, MEDIUM, HIGH, CRITICAL) are resolved dynamically from clinician-approved database policies rather than hardcoded floats.
2. **Predictive Uncertainty & Abstention:** Shannon entropy and probability margin are calculated for every inference. If normalized entropy exceeds `0.85` or margin falls below `0.08`, the engine marks the assessment as `is_abstaining=True` with a `REVIEW_REQUIRED` status.
3. **Out-of-Distribution Detection:** Incoming covariates are evaluated against baseline training manifolds. Outliers trigger an `ood_status="OUT-OF-DISTRIBUTION"` flag to warn attending clinicians.
4. **Deterministic Emergency Overrides:** If deterministic rules (such as severe tachycardia with hypotensive shock) fire, risk is escalated to `HIGH` or `CRITICAL` regardless of ML probability.

## Runtime Pipeline Flow
```
Clinical Encounters / Vitals
             ↓
Feature Normalization & Range Checks (`FeaturePreprocessor`)
             ↓
Data Quality Anomaly Audit (`ClinicalDataQualityService`)
             ↓
Out-of-Distribution Evaluation (`OODDetectionService`)
             ↓
Multi-Class ML Inference (Random Forest / SVC / AdaBoost)
             ↓
Uncertainty & Abstention Estimation (`PredictionConfidenceService`)
             ↓
Policy Threshold Stratification (`RiskThresholdPolicyService`)
             ↓
Deterministic Safety Rule Checks (`ClinicalRulesEngine`)
             ↓
TreeSHAP Attribution Attribution (`ExplanationService`)
             ↓
Neon PostgreSQL Persistence + Real-Time Redis Event Broadcast
```
