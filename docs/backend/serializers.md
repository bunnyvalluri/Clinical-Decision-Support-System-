# Serializers & Input Validation

DRF serializers enforce strict schema validation, type casting, and output filtering.

---

## 1. Serializer Design Patterns

1. **Separation of Read and Write:** Complex entities provide dedicated request and response serializers (e.g., `ReportCreateRequestSerializer` vs `ReportSerializer`).
2. **Defensive Range Validation:** `ClinicalRecordSerializer` enforces physiological boundaries:
   - Systolic BP: 50 – 300 mmHg
   - Diastolic BP: 30 – 200 mmHg
   - Heart Rate: 20 – 300 bpm
   - Oxygen Saturation: 50.0 – 100.0 %
3. **Enveloped Response Formatting:** APIs return uniform payloads:
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": { "timestamp": "2026-09-13T16:00:00Z" }
   }
   ```
