# Model Versioning & Registry

Trained model pipelines are tracked and cryptographically secured in the CDSS through the database (`apps.model_registry.models.ModelVersion`), file system registry (`ml/artifacts/models/`), and the cryptographic registry engine (`ml/registry/model_registry.py`).

---

## 1. Lifecycle States & Governance

Models transition through strict state machines:

```
[TRAINED] ---> [CANDIDATE] ---> (Benchmark & Safety Gate) ---> [APPROVED] ---> [ACTIVE]
                                                                                  |
                                                                          (Rollback / Deprecate)
                                                                                  v
                                                                             [ARCHIVED]
```

- **`CANDIDATE`**: Newly trained model undergoing automated evaluation benchmarks, fairness checks, and clinical error analysis. Cannot serve production traffic.
- **`APPROVED`**: Model has passed safety gates (Brier score < 0.15, zero critical false negatives, disparity ratio > 0.80) and received formal administrative sign-off (`approved_by`, `approval_notes`).
- **`ACTIVE`**: The single designated production model used by `ModelLoaderService` for live inference. Exactly one model per model name may be active at any time.
- **`ARCHIVED`**: Deprecated or rolled-back versions retained indefinitely for historical auditability and clinical-legal reproducibility.

---

## 2. Cryptographic Integrity & Anti-Tampering (SHA-256)

To prevent unsafe deserialization of untrusted binaries (e.g., pickle/joblib payload injections) and detect file system tampering:

1. **Artifact Hashing on Registration**:
   When a model is registered via `ModelRegistry.register_model(...)`, the serialized pipeline (`model.joblib`) is hashed using SHA-256:
   ```python
   hasher = hashlib.sha256()
   with open(model_path, "rb") as f:
       while chunk := f.read(65536):
           hasher.update(chunk)
   artifact_hash = hasher.hexdigest()
   ```

2. **Pre-Deserialization Verification**:
   Before `joblib.load()` is ever executed in production (`ModelRegistry.load_model` or `ProductionInferenceEngine`), the file's current SHA-256 hash is computed and compared to the registered hash:
   ```python
   if current_hash != expected_hash:
       raise ModelSecurityError(f"Artifact hash mismatch for {model_name} v{version}!")
   ```

---

## 3. Auditable Rollback Architecture

If live telemetry detects prediction drift, elevated clinician overrides, or degradation:
1. An administrator or automated governor invokes `rollback_model(model_name, reason="...")`.
2. The current `ACTIVE` model is transitioned to `ARCHIVED` with a recorded `rollback_reason`.
3. The previous `ACTIVE` or highest-performing validated version is promoted to `ACTIVE`.
4. A `ModelLifecycleEvent` (`MODEL_ROLLEDBACK`) is broadcast via Django Channels / WebSockets to connected clinician and admin dashboards in real time.
5. All transitions are logged to the immutable audit trail.
