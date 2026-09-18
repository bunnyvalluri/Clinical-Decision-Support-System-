# Model Registry & Governance Lifecycle — BPY-CSE-2666

## Lifecycle State Machine
```
DISCOVERED ──> TRAINING ──> EVALUATING ──> PENDING_REVIEW ──> APPROVED ──> ACTIVE / PRODUCTION
                                  │                                            │
                                  ▼                                            ▼
                           VALIDATION_FAILED                              ROLLED_BACK / ARCHIVED
```

## Mandatory Human Clinician Sign-Off
No machine learning model artifact is promoted to production merely because training completed without error.
Promotion requires:
1. **Automated Evaluation Gate:** Accuracy > 80%, ROC-AUC > 0.85, Zero missed critical cases in validation split.
2. **Fairness Gate:** Disparate impact ratio > 0.80 across protected demographic subgroups.
3. **Clinical Review Attestation:** An authorized Medical Informaticist or Lead Cardiologist must review validation metrics and submit documented clinical rationale.
4. **Cryptographic Integrity:** SHA-256 artifact hash must match the registry record.
