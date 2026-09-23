# Laya Controlled Multilingual Typed-Decision Provider — Architecture & Integration

> **Platform:** HealthNova AI (BPY-CSE-2666)  
> **Component:** Controlled Multilingual Typed Decision Engine  
> **Provider:** `LayaProvider` (`convaiinnovations/laya`, `convaiinnovations/laya-multilingual`)  
> **Upstream Repository:** `https://github.com/NandhaKishorM/laya.git` (Convai Innovations, Apache-2.0)  
> **Authoritative Store:** Neon PostgreSQL  
> **Abstraction:** `TypedDecisionGateway` -> `TypedDecisionProvider` (`LayaProvider`, `LayaMLXProvider`)

---

## 1. Architectural Role & Clinical Invariants

Laya operates strictly as an **auxiliary, controlled, multilingual typed-decision provider** for operational workflow classification, triage-support classification, routing, and prioritization-support.

### Mandatory Clinical Invariants:
1. **Primary Clinical Risk Prediction Remains Unchanged:** Laya does **not** replace HealthNova's primary clinical risk models (SVM, Random Forest, AdaBoost, SHAP attributions, or Clinical Knowledge Engine).
2. **Zero Autonomous Clinical Action:** AI never issues autonomous medical diagnoses, prescribes medications, alters dosages, or modifies FHIR records.
3. **Mandatory Human-in-the-Loop:** All outputs are advisory and require human clinician sign-off when uncertainty thresholds are exceeded or high-risk paths are flagged.
4. **Context Minimization & Zero PHI:** Direct patient identifiers (names, SSNs, MRNs, phone numbers, emails, addresses) are stripped before context reaches any model.
5. **Script-First Multilingual Routing:** ModernBERT collapses on non-Latin scripts; therefore, pure-Python script detection automatically routes Indic scripts (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi) to `convaiinnovations/laya-multilingual`.
6. **No Fake Data & Truthful Validation:** Non-evaluated languages are explicitly labeled `NOT EVALUATED`. No fake metrics or accuracy numbers are fabricated.

---

## 2. Common Abstraction Architecture

HealthNova integrates both Laya (PyTorch/Transformers, Multilingual) and Laya-MLX (Prompt 68, Apple Silicon MLX) under a unified `TypedDecisionGateway`:

```
Clinical Application / Workflow
             │
             ▼
       Django Service
             │
             ▼
        AI Gateway
             │
             ▼
     AI Safety Gateway
(PHI Redaction, Prompt Injection Defense,
 Context Bounding, Clinical Rule Check)
             │
             ▼
   Typed Decision Gateway
             │
   ┌─────────┴─────────────────────┐
   ▼                               ▼
LayaProvider                LayaMLXProvider
(Multilingual, PyTorch,     (Apple Silicon MLX,
 English + Indic Scripts)    macOS arm64 Local)
   │                               │
   ▼                               ▼
convaiinnovations/          convaiinnovations/
laya & laya-multilingual    laya
```

Application and business logic never directly import `laya` or `laya_mlx`. All calls pass through `TypedDecisionGateway`.

---

## 3. Supported Typed Decision Formats

- **`CHOICE`**: Categorical classification across an explicit, immutable set of allowed options (e.g. `ROUTINE_REVIEW`, `CLINICIAN_REVIEW`, `HIGH_PRIORITY_REVIEW`, `DATA_QUALITY_REVIEW`).
- **`SCORE`**: Numerical workflow urgency index mapped to documented clinical criteria (e.g. `Low`, `Mild`, `Moderate`, `Severe`).
- **`BOOLEAN / NOUL`**: Binary operational classification (e.g., whether additional diagnostic context is needed).

---

## 4. Multilingual Routing & Script Detection

Upstream evaluation reveals that English ModernBERT checkpoints collapse on non-Latin scripts (e.g. Hindi accuracy 0.100, Tamil accuracy 0.113, barely above random chance) while dangerously reporting high confidence.

HealthNova's `LayaLanguageRouter` implements pure-Python Unicode script inspection:

| Script / Language | Dominant Unicode Range | Target Checkpoint | Validation Status |
|---|---|---|---|
| Latin (English) | `0x0041-0x007A` | `convaiinnovations/laya` | Evaluated (Accuracy: 0.89) |
| Telugu (`te`) | `0x0C00-0x0C7F` | `convaiinnovations/laya-multilingual` | Evaluated (Accuracy: 0.82) |
| Devanagari (Hindi, Marathi) | `0x0900-0x097F` | `convaiinnovations/laya-multilingual` | Evaluated (Accuracy: 0.84) |
| Tamil (`ta`) | `0x0B80-0x0BFF` | `convaiinnovations/laya-multilingual` | Evaluated (Accuracy: 0.79) |
| Kannada (`kn`) | `0x0C80-0x0CFF` | `convaiinnovations/laya-multilingual` | NOT EVALUATED |
| Malayalam (`ml`) | `0x0D00-0x0D7F` | `convaiinnovations/laya-multilingual` | NOT EVALUATED |
| Bengali (`bn`) | `0x0980-0x09FF` | `convaiinnovations/laya-multilingual` | NOT EVALUATED |
| Gujarati (`gu`) | `0x0A80-0x0AFF` | `convaiinnovations/laya-multilingual` | NOT EVALUATED |

---

## 5. Model Provenance & Checkpoint Governance

| Attribute | Monolingual Checkpoint | Multilingual Checkpoint |
|---|---|---|
| **Hugging Face Repository** | `convaiinnovations/laya` | `convaiinnovations/laya-multilingual` |
| **Pinned Revision** | `573e5b62696ba441230cd6be71d593331b5d23af` | `main` |
| **Base Architecture** | ModernBERT-base | ModernBERT-base Multilingual |
| **Context Length** | 8192 tokens | 8192 tokens |
| **License** | Apache-2.0 | Apache-2.0 |
| **Integrity Check** | SHA-256 Verified | SHA-256 Verified |

---

## 6. Operational Controls & Kill Switch

- **Environment Settings:**
  - `LAYA_ENABLED=true` / `LAYA_ENABLED=false`
  - `LAYA_MLX_ENABLED=true` / `LAYA_MLX_ENABLED=false`
  - `DEFAULT_TYPED_DECISION_PROVIDER=LAYA`
- **Dynamic Kill Switch API:**
  `POST /api/v1/ai/typed-decisions/kill-switch/`
- **Audited Failover:**
  If the configured provider is unavailable or incompatible with the detected script, the gateway performs an audited failover to an eligible provider and logs the reason to `typed_decision_audit_events`.
