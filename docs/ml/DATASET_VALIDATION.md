# Tabular Dataset Clinical Validation Framework

## 1. Multi-Stage Validation Pipeline
Tabular datasets ingested into the CDSS undergo deterministic clinical and statistical validation:

### Stage 1: Quality Profiling (`DatasetQualityEngine`)
- **Missingness Analysis**: Feature-level and global missingness calculations. Missingness > 30% triggers `BLOCKING` or mandatory imputation warnings.
- **Degenerate Columns**: Flags zero-variance (constant) features and features with excessive cardinality.
- **Outlier Bounds**: Calculates IQR thresholds ($Q_1 - 1.5 \times \text{IQR}$, $Q_3 + 1.5 \times \text{IQR}$) to identify pathological extreme values.

### Stage 2: Evidence-Based Physiological Ranges (`ClinicalRangeValidator`)
Enforces physiological boundaries derived from published medical guidelines (AHA, ADA, WHO, KDIGO):
- **Systolic BP**: 50.0 - 260.0 mmHg (AHA/ACC 2017)
- **Diastolic BP**: 30.0 - 150.0 mmHg
- **Heart Rate**: 25.0 - 250.0 bpm (ACLS Guidelines)
- **Oxygen Saturation ($SpO_2$)**: 50.0 - 100.0% (Pulse Oximetry Biological Maximum; values > 100% trigger instant BLOCKING rejection)
- **Blood Glucose**: 20.0 - 800.0 mg/dL (ADA Standards)
- **Body Mass Index (BMI)**: 10.0 - 75.0 kg/m²

### Stage 3: Biological Contradiction Audits
- **Blood Pressure Inversion**: Any record where $\text{Systolic BP} \le \text{Diastolic BP}$ is flagged as a physiological impossibility.
- **Impossible Oxygenation**: $SpO_2 > 100\%$ violates physical principles.
- **Biologically Impossible Zeros**: Catching legacy database encoding artifacts (e.g. glucose = 0, blood pressure = 0 in Pima dataset).

### Stage 4: Data Leakage Detection (`DataLeakageDetector`)
- Detects target proxies ($r > 0.95$ Pearson correlation).
- Catches post-outcome interventions (e.g. `icu_stay_days`, `prescription_given`).
- Catches patient identifiers included in the predictor matrix.
