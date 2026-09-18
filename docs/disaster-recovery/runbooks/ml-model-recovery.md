# Runbook 08: Machine Learning Model Registry & Artifact Recovery

## 1. Symptoms
- Prediction engine throws deserialization errors (`pickle / joblib load failure`).
- Real-time inference latency exceeds 2000ms SLA.
- Clinical risk tier confidence scores drift or exhibit abnormal calibration errors.

## 2. Detection
- Alert `ALERT-ML-INFERENCE-ERROR` or `ALERT-DRIFT-DETECTED` fires.
- Model registry health check reports artifact checksum mismatch.

## 3. Preconditions
- ML Model Registry in Neon PostgreSQL is intact and accessible.
- Candidate model versions must have status `APPROVED` or `ROLLED_BACK`.
- Target model feature schema version must match the current application preprocessing version.

## 4. Authorization
- Medical Informaticist Lead and Clinical Safety Officer.
- **Rule**: NEVER automatically deploy the newest model during recovery. Only an explicitly approved model may become active.

## 5. Step-by-Step Execution
1. **Query Model Registry for Last Approved Stable Model**:
   ```sql
   SELECT id, model_name, version, checksum, feature_schema_version, status
   FROM model_versions
   WHERE status IN ('APPROVED', 'ROLLED_BACK')
   ORDER BY updated_at DESC
   LIMIT 5;
   ```
2. **Verify Cryptographic SHA-256 Checksum**:
   Calculate the local artifact hash and compare against registry:
   ```bash
   sha256sum /var/models/random_forest_risk_v1_0.joblib
   ```
3. **Execute Version-Aware Model Rollback**:
   Trigger rollback via API or Admin UI:
   ```bash
   curl -X POST http://localhost:8000/api/v1/infrastructure/rollback/ \
     -H "Authorization: Bearer $IT_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "rollback_type": "MODEL",
       "target_model_version": "1.0.0",
       "confirmation": "CONFIRM_ROLLBACK",
       "reason": "Calibration drift detected in ICU patient sub-cohort"
     }'
   ```
4. **Reload ML Engine Worker Cache**:
   Signal ASGI backend and Celery workers to purge cached model instances:
   ```bash
   docker compose restart backend celery_worker
   ```

## 6. Validation
- Run test prediction inference:
  ```bash
  python manage.py test_model_inference --version=1.0.0
  ```
- Verify SHAP attribution vectors compute without errors.
- Confirm active model version in `/api/v1/models/active/` matches `1.0.0`.

## 7. Rollback
- If target model also misbehaves, revert to deterministic clinical rule baseline (qSOFA / NEWS2) and render `"Prediction service unavailable"`.

## 8. Escalation Path
- Lead MLOps Engineer -> Clinical Safety Officer.

## 9. Post-Recovery Monitoring
- Monitor Brier score, ROC-AUC, and feature distribution drift for 72 hours.
