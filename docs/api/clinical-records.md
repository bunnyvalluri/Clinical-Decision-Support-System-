# Clinical Records API

Endpoints for recording and retrieving serial clinical encounters and vital sign measurements.

---

## 1. Endpoints

### 1.1 `POST /api/v1/patients/{patient_id}/clinical-records/`
Record a new clinical vital observation encounter.
- **Request Body:**
  ```json
  {
    "encounter_type": "EMERGENCY",
    "systolic_bp": 172.0,
    "diastolic_bp": 104.0,
    "heart_rate": 118,
    "respiratory_rate": 26,
    "oxygen_saturation": 89.0,
    "body_temperature": 37.6,
    "glucose_level": 184.0,
    "cholesterol_total": 284.0,
    "bmi": 29.4,
    "creatinine": 1.45,
    "sodium": 138.0,
    "potassium": 4.2,
    "chief_complaint": "Acute retrosternal chest pain radiating to jaw",
    "clinical_notes": "Continuous bedside telemetry initiated in ICU-Bed-04."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "patient": "uuid",
    "encounter_type": "EMERGENCY",
    "systolic_bp": 172.0,
    "heart_rate": 118,
    "recorded_at": "2026-09-13T16:15:00Z"
  }
  ```

### 1.2 `GET /api/v1/patients/{patient_id}/clinical-records/`
Retrieve longitudinal timeline of vital sign encounters for a patient.
