# ADR-0068: Integration of Laya-MLX as an Auxiliary Typed-Decision AI Engine

## Status
Accepted

## Context
HealthNova AI requires structured, high-speed, local auxiliary decision classification (such as operational triage routing, review urgency categorizations, and information-completeness flags) to optimize clinician workflows without sending clinical context to external third-party cloud LLM APIs.

The upstream repository `https://github.com/mizorewww/laya-mlx.git` implements `laya-mlx`, an Apple Silicon native MLX runtime for Laya typed decisions (`choice`, `score`, `noul`).

However:
1. Primary clinical patient risk prediction in HealthNova AI is governed by trained, validated, calibrated, and SHAP-explained models (SVM, Random Forest, AdaBoost) with authoritative records stored in Neon PostgreSQL.
2. Apple MLX is hardware-restricted to macOS on Apple Silicon (`arm64`), whereas HealthNova AI deploys across Linux Docker containers (Coolify, Kubernetes) and developer workstations.
3. Uncontrolled AI decision outputs without calibration or option-permutation robustness can introduce positional bias.

## Decision
1. **Auxiliary Role Invariant:** We integrate Laya-MLX strictly as an **auxiliary typed-decision engine**. It shall never replace, modify, or override primary clinical ML models, nor shall it issue autonomous diagnoses or prescriptions.
2. **Provider Abstraction Layer:** Application code shall not import `laya_mlx` directly. All invocations route through `TypedDecisionProvider` and `LayaMLXProvider` behind the AI Safety Gateway.
3. **Platform Introspection & Capability Fallback:** HealthNova dynamically probes the platform. When deployed on non-Apple-Silicon hardware, it reports `UNSUPPORTED_PLATFORM` or routes to a dedicated Apple Silicon inference service worker (`LAYA_MLX_SERVICE_URL`) without fabricating results.
4. **Mandatory Safety Pipeline:**
   - Zero direct PHI (regex and context minimization).
   - Prompt injection defense.
   - Permutation robustness evaluation (`evaluate_permutation_robustness`) to guarantee option-order stability.
   - Shannon entropy uncertainty thresholding (flagging decisions with entropy > 0.75 or confidence < 0.60 for mandatory clinician sign-off).
5. **Operational Kill Switch:** The engine can be instantly disabled via `LAYA_MLX_ENABLED=false` or dynamic API without affecting core EHR and clinical risk prediction capabilities.

## Consequences
- **Positive:** Low-latency local decision support on Apple Silicon hardware; complete platform isolation preventing environment destabilization on Linux/Windows; robust audit logging in Neon PostgreSQL; tamper-evident human-in-the-loop sign-off.
- **Negative:** Native MLX inference requires dedicated Apple Silicon hardware (or sandbox harness for tests).
