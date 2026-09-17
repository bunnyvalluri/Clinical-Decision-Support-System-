# API Test Data & Synthetic Identities — HealthNova AI CDSS

## 1. Synthetic Role Identities

All Bruno automated tests authenticate using dedicated, non-production test accounts:

| Role Name | Username | Expected Role Claim | Permitted Workflows |
| :--- | :--- | :--- | :--- |
| **Doctor** | `test_doctor` | `DOCTOR` | Patient care teams, vitals review, ML predictions, clinical notes |
| **Nurse** | `test_nurse` | `NURSE` | Triage queue, bedside vitals entry, clinical tasks |
| **Informaticist**| `test_informaticist` | `INFORMATICIST` | Model registry, data quality, drift metrics, NocoDB analytics |
| **IT Admin** | `test_admin` | `ADMIN` | User roles, service health, Celery status, audit logs |
| **Patient** | `test_patient` | `PATIENT` | Self portal only (own vitals, own appointments, own summaries) |

---

## 2. Test Fixture Identification Rules

1. **Patient UUIDs**: Fixed synthetic UUIDs (e.g., `00000000-0000-0000-0000-000000000001`).
2. **Medical Record Numbers**: Strictly formatted as `TEST-MRN-XXX` or `SYNTH-MRN-XXX`.
3. **Clinical Range Validation**:
   - Systolic BP: 90 - 200 mmHg (Test values: `120`, `145`)
   - Diastolic BP: 60 - 120 mmHg (Test values: `80`, `92`)
   - Heart Rate: 50 - 180 bpm (Test values: `72`, `88`)
   - Respiration Rate: 10 - 40 /min (Test values: `16`, `22`)
   - Body Temperature: 35.0 - 41.0 °C (Test values: `37.0`, `38.2`)
   - Blood Glucose: 60 - 400 mg/dL (Test values: `95`, `180`)
4. **Idempotency & Cleanup**: Tests creating records utilize synthetic slugs and IDs that are either executed in transaction rollbacks or safely quarantined with status `TEST_ISOLATED`.
