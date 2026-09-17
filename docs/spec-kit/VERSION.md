# GitHub Spec Kit Version & Lifecycle Management

**Project**: Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
**Component**: GitHub Spec Kit (Engineering Governance Layer)  
**Document**: `docs/spec-kit/VERSION.md`  

---

## 1. Pinned Release Information

| Field | Detail |
| :--- | :--- |
| **Tool Name** | GitHub Spec Kit (`specify-cli`) |
| **Installed Version** | `1.0.8.dev0` |
| **Upstream Git Commit** | `7466e2afe2283e8673c099711fa4813900ca8505` |
| **Repository URL** | `https://github.com/github/spec-kit.git` |
| **Installation Tool** | `uv tool install --from git+https://github.com/github/spec-kit.git specify-cli` |
| **Python Runtime** | Python 3.13.5 |
| **Platform** | Windows AMD64 (Native PowerShell execution) |
| **License** | MIT License (GitHub, Inc.) |
| **Date Adopted** | 2026-09-17 |
| **Integration Mode** | Dual Agent Integration: Antigravity (`agy`) & Cline (`cline`) |

---

## 2. Integration Architecture & Assets

```text
.specify/
├── memory/
│   └── constitution.md              # Healthcare CDSS Constitution (30 Articles)
├── templates/
│   ├── spec-template.md             # Enriched with healthcare, RBAC, and clinical safety
│   ├── plan-template.md             # Enriched with Neon PostgreSQL, Celery, and Channels
│   ├── tasks-template.md            # Phased execution with Bruno/React Doctor quality gates
│   ├── clinical-spec-template.md    # qSOFA/NEWS2 guardrails & clinician sign-off
│   ├── ml-spec-template.md          # Dataset splitting, TreeSHAP, and drift monitoring
│   ├── ai-spec-template.md          # Multi-tier prompt injection defense & tool allowlists
│   ├── api-spec-template.md         # DRF contracts, Bruno test requirements, and IDOR defense
│   └── database-spec-template.md    # Neon PostgreSQL schema invariants & non-blocking migrations
├── scripts/powershell/              # Official Spec Kit automation scripts
├── workflows/                       # Core Spec Kit workflow definitions
├── extensions.yml                   # Registered healthcare governance extensions & hooks
├── init-options.json                # Project initialization options
└── integration.json                 # Dual agy & cline integration state

.agents/skills/
├── speckit-constitution/            # /speckit-constitution
├── speckit-specify/                 # /speckit-specify
├── speckit-plan/                    # /speckit-plan
├── speckit-tasks/                   # /speckit-tasks
├── speckit-implement/               # /speckit-implement
├── speckit-converge/                # /speckit-converge
├── speckit-analyze/                 # /speckit-analyze
├── speckit-checklist/               # /speckit-checklist
├── speckit-clarify/                 # /speckit-clarify
└── speckit-taskstoissues/           # /speckit-taskstoissues
```

---

## 3. Maintenance & Safe Upgrade Procedure

To safely upgrade Spec Kit without perturbing custom healthcare templates or workspace configurations:

1. **Verify Current State**:
   ```bash
   specify self check
   specify check
   ```
2. **Preview Upgrades (Dry Run)**:
   ```bash
   specify self upgrade --dry-run
   ```
3. **Upgrade CLI via `uv`**:
   ```bash
   uv tool upgrade specify-cli
   ```
4. **Run Health Check & Convergence Validation**:
   ```bash
   python scripts/validate_specs.py
   python scripts/converge.py
   ```

---

## 4. Rollback Procedure
If an upstream Spec Kit update introduces breaking template or workflow issues:
1. Revert to the pinned commit:
   ```bash
   uv tool install --force --from git+https://github.com/github/spec-kit.git@7466e2afe2283e8673c099711fa4813900ca8505 specify-cli
   ```
2. Restore `.specify/` from git history:
   ```bash
   git checkout HEAD -- .specify/
   ```
3. Re-verify convergence:
   ```bash
   python scripts/converge.py
   ```
