# Model Deployment & Rollback Runbook — BPY-CSE-2666

> **Audience**: Medical Informaticists, IT Admins, Lead ML Engineers  
> **Deployment Method**: Canary / Shadow / Instant Atomic Promotion

---

## 1. Pre-Deployment Verification Checklist

Before promoting any model version from `APPROVED` to `PRODUCTION`:

- [ ] Model is in `APPROVED` status with verified human clinician sign-off (`activated_by`).
- [ ] SHA-256 artifact checksum matches the database registry record.
- [ ] Test partition metrics satisfy minimum clinical thresholds:
  - Macro Recall $\ge 0.90$
  - F1 Score $\ge 0.92$
  - Brier Calibration Score $\le 0.05$
- [ ] Fairness disparity audit reveals zero significant demographic bias.
- [ ] In-process ASGI inference latency $\le 50\text{ ms}$.

---

## 2. Deployment Execution Steps

### Step 1: Promotion via API / Interface
Authenticated Informaticist submits deployment request:
```http
POST /api/v1/ml/models/{id}/deploy/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "target_stage": "PRODUCTION",
  "reason": "Scheduled promotion of validated Random Forest v1.1.0 champion"
}
```

### Step 2: Atomic State Transition (PostgreSQL Transaction)
The deployment service executes an atomic transaction:
1. Locks the active model record (`select_for_update`).
2. Demotes current `PRODUCTION` model to `ARCHIVED` or `DEPRECATED`.
3. Sets candidate model to `PRODUCTION` and updates `activated_at` and `activated_by`.
4. Writes an immutable record to `AuditLog`.
5. Invalidates in-memory Redis model cache (`ModelLoaderService.invalidate_cache`).
6. Broadcasts `MODEL_DEPLOYED` WebSocket event to connected Informaticist consoles.

---

## 3. Emergency Instant Rollback Procedure

If severe prediction drift, calibration degradation, or unexpected clinical outcomes occur:

### One-Click Instant Rollback
```http
POST /api/v1/ml/models/{id}/rollback/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "to_version": "1.0.0",
  "reason": "Emergency rollback: sudden distribution drift detected in ICU ward vitals"
}
```
The rollback service immediately activates the prior stable production version in sub-50 milliseconds and archives the problematic candidate version with status `ROLLED_BACK`.
