# Database Models Specification

This document details each Django ORM model entity and its clinical purpose.

---

## 1. Models Inventory

### 1.1 `User` (`apps.accounts.models.User`)
Custom user model extending `AbstractUser`:
- `email`: Institutional email address (unique username identifier).
- `role`: Clinical role taxonomy (`ADMIN`, `CLINICIAN`/`DOCTOR`, `NURSE`, `STAFF`, `PATIENT`).
- `department`: Clinical department assignment (e.g., Cardiology, Emergency, ICU).

### 1.2 `Patient` (`apps.patients.models.Patient`)
Demographic master record:
- `mrn`: Medical Record Number (e.g., `MRN-2026-0001`), unique indexed.
- `date_of_birth`: Used to derive patient age dynamically during feature preprocessing.
- `gender`: Biological sex category (`MALE`, `FEMALE`, `OTHER`, `UNKNOWN`).
- `blood_group`: ABO/Rh typing (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- `primary_physician`: Foreign key to `User`.

### 1.3 `ClinicalRecord` (`apps.clinical.models.ClinicalRecord`)
Encounter vitals and biomarkers:
- `systolic_bp`, `diastolic_bp`: Blood pressure measurements in mmHg.
- `heart_rate`, `respiratory_rate`: Vital frequencies.
- `oxygen_saturation`: Pulse oximetry percentage.
- `glucose_level`, `cholesterol_total`: Serum lab results.
- `bmi`, `creatinine`, `sodium`, `potassium`: Renal and metabolic indicators.

### 1.4 `Prediction` (`apps.predictions.models.Prediction`)
Output of ML inference:
- `prediction_result`: Stratified risk (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- `probability`: Continuous model probability $[0.0, 1.0]$.
- `confidence_score`: Empirical certainty measure.
- `inference_latency_ms`: Computational time required for model execution.
- `clinician_override`: Physician-assigned risk override.
- `override_reason`: Mandatory clinical justification for override.

### 1.5 `PredictionExplanation` (`apps.predictions.models.PredictionExplanation`)
SHAP factor interpretation:
- `top_features`: JSON array of feature contributions with directional impacts.
- `base_value`: Background population risk baseline.
- `disclaimer`: Mandatory legal notice for medical decision support.
