# Clinical Decision Support System — Specification Repository (`specs/`)

> **Framework**: GitHub Spec Kit Spec-Driven Development (SDD)  
> **Application**: Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
> **Role**: Authoritative Engineering Governance & Specification System

---

## 1. Purpose of this Specification System
This directory houses the formal, versioned engineering specifications for the Healthcare Clinical Decision Support System. 

In accordance with the **Healthcare CDSS Constitution** (`specs/constitution/CONSTITUTION.md`), no substantial feature or architectural change may be committed directly to code without first establishing:
1. **Clinical & Business Objectives**
2. **Stable Requirement IDs (`FR-*`, `NFR-*`, `ML-*`, `AI-*`)**
3. **Formal Architectural Plans (`plan.md`)**
4. **Actionable, Traceable Tasks (`tasks.md`)**
5. **Concrete Acceptance & Automated Test Suites**
6. **Clinical Safety & Multi-Tier Authorization Gates**
7. **End-to-End Convergence (`python scripts/converge.py`)**

> [!IMPORTANT]
> **DEVELOPMENT INFRASTRUCTURE ONLY**: Spec Kit is strictly an engineering governance tool. It is **NEVER** part of runtime clinical infrastructure, clinical prediction paths, patient databases, or authentication services.

---

## 2. Directory Structure

```text
specs/
├── README.md                      # This file
├── INDEX.md                       # Comprehensive Specification Index
├── TRACEABILITY-MATRIX.md         # Requirements-to-Code Traceability Matrix
├── constitution/                  # Foundational Project Governance
│   └── CONSTITUTION.md            # The Thirty Articles of Healthcare CDSS Governance
├── architecture/                  # Architectural Blueprint Specifications
│   └── SYSTEM-ARCHITECTURE-SPEC.md
├── clinical/                      # Clinical Protocols & Safety Boundaries
│   └── CLINICAL-SAFETY-SPEC.md
├── security/                      # Threat Models, RBAC, & Privacy Specifications
│   └── SECURITY-PRIVACY-SPEC.md
├── database/                      # Neon PostgreSQL Schema & Relational Specifications
│   └── DATABASE-SPEC.md
├── frontend/                      # Next.js, shadcn/ui, & White-Only Theme Specifications
│   └── FRONTEND-SPEC.md
├── backend/                       # Django REST Framework & Domain Service Specifications
│   └── BACKEND-SPEC.md
├── realtime/                      # Django Channels & WebSocket Event Specifications
│   └── REALTIME-CHANNELS-SPEC.md
├── ml/                            # Machine Learning Models, Calibration, & Drift Specifications
│   └── ML-GOVERNANCE-SPEC.md
├── ai/                            # AI Assistant, Ollama, & RAG Specifications
│   └── AI-ASSISTANT-RAG-SPEC.md
├── integrations/                  # Auxiliary System Boundary Specifications (Meilisearch, PocketBase, etc.)
│   └── EXTERNAL-INTEGRATIONS-SPEC.md
├── infrastructure/                # Docker, Coolify, Nginx, & SRE Specifications
│   └── DEPLOYMENT-INFRA-SPEC.md
├── testing/                       # Quality Gates, Bruno, & React Doctor Specifications
│   └── TEST-STRATEGY-SPEC.md
├── operations/                    # Incidents, Postmortems, & Disaster Recovery Specifications
│   └── OPERATIONS-INCIDENTS-SPEC.md
└── features/                      # Traceable Feature Specifications
    ├── patient-risk-prediction/   # Canonical Feature: ML Risk Prediction & TreeSHAP
    │   ├── spec.md
    │   ├── plan.md
    │   ├── tasks.md
    │   ├── acceptance.md
    │   ├── security.md
    │   ├── clinical-safety.md
    │   ├── test-plan.md
    │   └── changelog.md
    └── doctor-ai-assistant/       # Canonical Feature: Decision Support Assistant
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── acceptance.md
        ├── security.md
        ├── clinical-safety.md
        ├── test-plan.md
        └── changelog.md
```

---

## 3. Specification Lifecycle Workflow

```
[ CLINICAL / BUSINESS NEED ]
             ↓
[ CONSTITUTION AUDIT ] (specs/constitution/CONSTITUTION.md)
             ↓
[ SPECIFY ] (/speckit-specify → spec.md)
             ↓
[ PLAN ] (/speckit-plan → plan.md)
             ↓
[ TASKS ] (/speckit-tasks → tasks.md)
             ↓
[ IMPLEMENT ] (/speckit-implement → Django / Next.js / Celery)
             ↓
[ TESTS ] (pytest + Bruno + React Doctor)
             ↓
[ SECURITY & CLINICAL AUDIT ] (Clinical Safety Agent + IDOR Tests)
             ↓
[ CONVERGE ] (python scripts/converge.py)
             ↓
[ RELEASE ]
```

---

## 4. Verification Commands

- Validate specification structure and requirement IDs:
  ```bash
  python scripts/validate_specs.py
  # or: make specs-validate
  ```
- Run the comprehensive convergence gate:
  ```bash
  python scripts/converge.py
  # or: make converge
  ```
