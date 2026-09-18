# Clinical Data Quality Engine — BPY-CSE-2666

## Objectives
The `ClinicalDataQualityService` detects physiological contradictions, unit errors, missing critical inputs, and distribution drift before records enter the inference pipeline.

## Anomaly Taxonomies (`DataQualityIssueType`)
1. **`INVALID_VALUE`:** Measurements outside biological limits (e.g. Systolic BP < 40 or > 300 mmHg, Heart Rate > 250 bpm).
2. **`MISSING_CRITICAL`:** Missing mandatory covariates (Age, Biological Sex, Systolic BP, Heart Rate).
3. **`OUTLIER`:** Extreme values exceeding 3 standard deviations from cohort means.
4. **`DUPLICATE`:** Conflicting observation timestamps for the same patient encounter.
5. **`UNIT_MISMATCH`:** Glucose in mmol/L rather than standard mg/dL.

All anomalies are tracked in `clinical_data_quality_issues` with resolution statuses (`OPEN`, `INVESTIGATING`, `RESOLVED`).
