# Model Versioning & Registry

Trained model pipelines are tracked in the database through the `apps.model_registry.models.ModelVersion` table.

---

## 1. Lifecycle States

- `CANDIDATE`: Newly trained model undergoing automated evaluation benchmarks.
- `ACTIVE`: The single designated production model used by `ModelLoaderService`.
- `ARCHIVED`: Deprecated versions retained for historical audit reproducibility.

Each record stores SHA-256 artifact hashes, training dates, benchmark metrics, and file system artifact locations.
