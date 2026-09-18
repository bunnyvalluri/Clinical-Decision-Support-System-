# Model Drift & Distribution Monitoring — BPY-CSE-2666

## Metrics & Thresholds
1. **Population Stability Index (PSI):**
   - `PSI < 0.10`: Normal (No significant distribution shift).
   - `0.10 <= PSI < 0.25`: Warning (Moderate shift; initiate telemetry audit).
   - `PSI >= 0.25`: Critical (Severe feature divergence; retraining gate triggered).

2. **Kolmogorov-Smirnov (KS) Test:** Two-sample test comparing trailing 14-day production encounters against baseline validation sets.

## Persisted Audits
Drift telemetry is persisted in `model_drift_reports` with status tags (`NORMAL`, `WARNING`, `CRITICAL`) and exposed to informaticists at `/informaticist/models/research`.
