# Laya Ultrafast Controlled Browser Agent Integration

## 1. Overview & Purpose
This document specifies the integration of **Laya Ultrafast** (`ipenywis/laya-ultrafast`) into HealthNova AI as an **OPTIONAL, CONTROLLED browser-agent capability**.

### Critical Healthcare Invariants
```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.              ║
║ 2. ZERO patient PHI is stored in agent memory or shared vector indices.    ║
║ 3. AI NEVER issues autonomous medical diagnoses or final prescriptions.   ║
║ 4. Laya is NOT the clinical prediction engine (SVM/RF/AdaBoost/SHAP).      ║
║ 5. A Laya model DONE choice is NEVER proof of success.                     ║
║ 6. Arbitrary shell, raw SQL, and unredacted PHI exports are FORBIDDEN.     ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## 2. Architectural Boundary & Information Flow
Laya operates as an isolated component strictly behind the HealthNova Agent Safety Gateway:

```
HEALTHNOVA FRONTEND (/admin/ai-agents)
         │ [HTTPS / JWT + RBAC]
         ▼
DJANGO REST API (/api/v1/ai-agents/browser/)
         │
         ▼
AGENT SAFETY GATEWAY (backend/apps/ai_agents/services/safety_gateway.py)
   ├── Emergency Kill Switch Check
   ├── Prompt Injection Filter (Regex & Semantic Scanner)
   ├── Destination Allowlist & SSRF Defense (Blocks 127.0.0.1, 10.0.0.0/8, 169.254.169.254)
   ├── PHI Boundary Guard (Default DENY)
   ├── Controlled Tool Registry (Permission & Role Validation)
   └── Risk Level Classification (LOW: Auto, MED: Logged, HIGH/CRIT: Approval Required)
         │
         ▼
APPROVAL GATEWAY (backend/apps/ai_agents/browser_views.py)
   └── [If HIGH/CRIT] ──► AWAITING_APPROVAL (Human Clinician/Admin sign-off required)
         │
         ▼
CELERY ASYNC WORKER (backend/apps/ai_agents/tasks.py)
         │
         ▼
LAYA AGENT ADAPTER (backend/integrations/laya_agent/adapter.py)
   ├── Runtime Detection (MLX on Apple Silicon vs Remote API vs Sandboxed Harness)
   └── Isolated Execution Loop
         │
         ▼
BROWSER HARNESS (browser-harness / Playwright Headless)
         │
         ▼
APPROVED DESTINATION (e.g. who.int, cdc.gov, nih.gov)
         │
         ▼
INDEPENDENT VERIFICATION ENGINE (BrowserOutcomeVerifier)
         │
         ▼
AUDIT LOG & REALTIME BROADCAST (Neon AuditLog & Django Channels WebSocket)
```

## 3. Platform & Hardware Strategy
- **Upstream Dependency**: `laya-mlx` is designed specifically for Apple Silicon (macOS `arm64`).
- **HealthNova Strategy**: HealthNova remains 100% hardware-neutral.
- On standard Linux/Windows production servers or CI environments:
  - If Apple Silicon is detected: uses local MLX model weights.
  - If `LAYA_SERVICE_URL` is set: communicates with external Laya microservice container.
  - If neither is present: honestly reports `LAYA_AGENT_NOT_AVAILABLE` without breaking any core clinical prediction, FHIR, or patient portal services.
