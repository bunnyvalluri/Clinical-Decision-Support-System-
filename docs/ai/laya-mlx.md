# Laya-MLX Controlled Local Typed-Decision AI Engine — Integration Specification

> **Platform:** HealthNova AI (BPY-CSE-2666)  
> **Component:** Auxiliary Typed Decision AI Engine  
> **Provider:** `laya-mlx` (Apple Silicon Native MLX Runtime)  
> **Upstream Repository:** `https://github.com/mizorewww/laya-mlx.git`  
> **Derived From:** `https://github.com/NandhaKishorM/laya` (Convai Innovations, Apache-2.0)  
> **Authoritative Store:** Neon PostgreSQL

---

## 1. Architectural Role & Invariants

Laya-MLX provides **auxiliary structured typed decisions** for operational and workflow support within HealthNova AI.

### Non-Negotiable Invariants:
1. **Auxiliary Decision Support Only:** Laya-MLX **never** replaces primary clinical ML models (SVM, Random Forest, AdaBoost, calibrated risk predictions, or SHAP attributions).
2. **Zero Autonomous Clinical Action:** Laya-MLX outputs are strictly advisory. AI never issues medical diagnoses, prescribes treatments, or modifies patient medical records without explicit clinician approval.
3. **Platform Isolation & Graceful Fallback:** Native Apple MLX runs only on Apple Silicon (macOS `arm64`). In non-Apple environments (Windows development, Linux x86_64, standard CI), HealthNova honestly reports `UNSUPPORTED_PLATFORM` and falls back cleanly without fabricating clinical results.
4. **Context Minimization & PHI Redaction:** Direct patient identifiers (SSNs, MRNs, phone numbers, emails, names) are stripped before context reaches the decision engine.
5. **Permutation Robustness:** Schemas must pass option-order permutation tests (`[A, B, C, D]` vs `[B, A, C, D]`, etc.) to prevent positional bias.

---

## 2. Architectural Pipeline

```
HealthNova Clinician Portal / Workflow
                   │
                   ▼
          Clinical AI Gateway
                   │
                   ▼
           AI Safety Gateway
    (Context Minimization, PHI Redaction,
     Prompt Injection Defense, Rule Check)
                   │
                   ▼
        Typed Decision Gateway
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
Laya-MLX Adapter        Other AI Providers
(LayaMLXProvider)         (Ollama, etc.)
       │
       ▼
   laya_mlx
(Native MLX on macOS arm64 /
 Sandbox harness on tests)
```

---

## 3. Supported Typed Decision Formats

1. **`CHOICE` (Categorical Classification):**
   - Example: Workflow triage routing (`ROUTINE_REVIEW`, `CLINICIAN_REVIEW`, `HIGH_PRIORITY_REVIEW`, `DATA_QUALITY_REVIEW`).
2. **`SCORE` (Numerical Workflow Urgency):**
   - Example: Urgency level calculated with explicit clinical legend criteria.
3. **`BOOLEAN / NOUL` (Binary Operational Gate):**
   - Example: Additional clinical information required prior to automated synthesis (`true` / `false`).

---

## 4. Platform Requirements & Capabilities

| Component | Minimum Requirement | Upstream Pinned Version |
|---|---|---|
| OS | macOS (Darwin) | >= 14.0 (Sonoma / Sequoia) |
| Architecture | Apple Silicon (`arm64`) | M1 / M2 / M3 / M4 |
| MLX Framework | `mlx >= 0.32.2, < 0.33` | 0.32.2 |
| Python | `>= 3.11` | 3.11+ |
| Pinned Checkpoint | `convaiinnovations/laya` | Revision: `573e5b62696ba441230cd6be71d593331b5d23af` |
| Checksum | SHA-256 Verified | `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

### Capability States:
- `SUPPORTED`: Host platform is Apple Silicon with MLX ready.
- `UNSUPPORTED_PLATFORM`: Host OS or CPU architecture does not support native MLX.
- `DEPENDENCY_MISSING`: Apple Silicon detected, but `mlx` Python package is uninstalled.
- `MODEL_MISSING`: Checkpoint files not downloaded to cache directory.
- `CONFIGURATION_REQUIRED`: Missing revision or model identifier configuration.
- `READY`: Pinned model loaded and verified for inference.
- `DEGRADED`: Circuit breaker open due to consecutive timeouts or errors.
- `DISABLED`: Master kill switch active (`LAYA_MLX_ENABLED=false`).

---

## 5. API Reference

### Capability Detection
```http
GET /api/ai/providers/laya/capabilities
```
**Response:**
```json
{
  "provider": "laya-mlx",
  "available": false,
  "health": "UNSUPPORTED_PLATFORM",
  "platform_supported": false,
  "os": "Windows",
  "arch": "AMD64",
  "details": "Apple MLX requires macOS on Apple Silicon (arm64)."
}
```

### Typed Decision Inference
```http
POST /api/v1/ai/typed-decisions/predict/
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "schema_name": "triage_workflow_routing",
  "schema_version": "1.0.0",
  "case_context": "Patient vitals stable. SpO2 99%, HR 74, BP 120/80.",
  "correlation_id": "req-98234-a1"
}
```

---

## 6. Operational Kill Switch & Rollback

- **Environment Variable:** `LAYA_MLX_ENABLED=false` in `.env`.
- **Dynamic API:** `POST /api/v1/ai/typed-decisions/kill-switch/` with `{"enabled": false, "reason": "Incident response"}`.
- **Rollback:** Disable the provider. The platform immediately marks decisions as unavailable without dropping active requests or compromising core ML models.
