# HealthNova AI — Features Page Documentation

> **Page Route:** `/features`  
> **Classification:** Public Features & Healthcare Intelligence Showcase  
> **Theme:** Strict White / Light Mode (`#ffffff`, Slate borders, Teal & Navy accents)  
> **Authoritative Database:** Neon PostgreSQL (100% Unchanged)  
> **Academic Lineage:** `BPY-CSE-2666`

---

## 1. Overview & Clinical Positioning

The `/features` page communicates the technical capabilities, clinical workflows, and safety safeguards of the platform to six primary stakeholder audiences:
- **Patients / Users:** Personal vitals tracking, risk assessment history, and longitudinal health records.
- **Doctors / Specialists:** Bedside clinical decision support, calibrated risk predictions, TreeSHAP attributions, and clinician override workflows.
- **Nurses / Triage Staff:** Vitals recording, rapid risk screening, and real-time ward deterioration escalations.
- **Medical Informaticists:** Champion model management (Random Forest, SVM, AdaBoost), Brier score calibration, and Population Stability Index (PSI) drift monitoring.
- **Healthcare Organizations:** Evidence-aware care pathway standardization and auditability.
- **Authorized Administrators:** Granular role-based access control (RBAC), security audit trails, and infrastructure telemetry.

### Core Non-Autonomous Safety Invariant
The platform is positioned as **assistive clinical decision support**. It strictly **never** issues autonomous medical diagnoses, autonomous prescriptions, or unverified treatment orders. All predictions are decision-support outputs requiring licensed physician sign-off.

---

## 2. Component Architecture

All UI components are modularized in `frontend/src/components/features/` and composed within the Server Component `frontend/src/app/features/page.tsx`:

```
frontend/src/
├── app/
│   └── features/
│       └── page.tsx                      # Server Component with complete SEO metadata
├── config/
│   ├── navigation.ts                     # Centralized public navigation configuration
│   └── features.ts                       # Typed datasets for features, capabilities, roles, and FAQs
└── components/
    ├── layout/
    │   ├── PublicNavbar.tsx              # Universal public navbar with active /features tracking
    │   └── PublicFooter.tsx              # Universal public footer linking to /features
    └── features/
        ├── FeaturesHero.tsx              # Breadcrumbs, headline, CTAs, and mobile device mockup
        ├── CapabilityTrustStrip.tsx      # 6-item trust strip under the hero
        ├── FeatureHighlightCards.tsx     # 2 large highlight cards (Patient & Clinician)
        ├── FeatureGrid.tsx               # 12 powerful feature cards (3-col responsive grid)
        ├── AIIntelligenceSection.tsx     # 12 AI capabilities in light healthcare tech aesthetic
        ├── RoleFeatures.tsx              # 5 role-specific workspace cards with authorized links
        ├── MLWorkflow.tsx                # 8-step ML care pathway & risk prediction safety disclaimer
        ├── RealTimeFeatures.tsx          # Sub-20ms WebSocket telemetry (Django Channels & Redis)
        ├── SecurityFeatures.tsx          # 6 security pillars (RBAC, TLS 1.3, AES-256, Audit trails)
        ├── DataFlowVisual.tsx            # 8-node end-to-end architecture flow diagram
        ├── FeaturesFAQ.tsx               # Accessible shadcn Accordion answering 8 key questions
        ├── FeaturesCTA.tsx               # Pre-footer call to action for platform exploration
        └── index.ts                      # Barrel export
```

---

## 3. Section Details & Visual Hierarchy

| Section | Headline / Eyebrow | Key Visual & Architectural Highlights |
| :--- | :--- | :--- |
| **Hero** | `OUR FEATURES` / `Smarter Tools for Everyday Healthcare` | Includes breadcrumbs (`Home > Features`), clinician disclaimer, and an illustrative bedside mobile mockup displaying normal heart rate (72 bpm), blood pressure (120/80), SpO2 (98%), and calibrated Low Risk tier (18.4%). |
| **Trust Strip** | 6 Capability Badges | Quick trust badges: AI-Powered, Real-Time Data, Explainable ML, Secure & Compliant, Human-in-the-Loop, and Designed for Teams. |
| **Highlight Cards** | Two Large Focus Cards | Side-by-side comparison: *Patient Health Intelligence* (`/user/dashboard`) and *Clinical Decision Support* (`/doctor/dashboard`). |
| **Powerful Grid** | `Personalized Care. Real Impact.` | 12 cards spanning risk prediction, real-time alerts, vitals records, trend analysis, clinical reports, and data quality screening. |
| **AI Intelligence** | `AI-Powered Clinical Intelligence` | 12 capabilities presented in a crisp, light tech aesthetic, paired with clear ethical invariants detailing what AI does vs. what AI never does. |
| **Role Features** | `Built for Every Healthcare Role` | Dedicated cards for Patient, Doctor, Nurse, Informaticist, and Administrator with authorized route links. |
| **ML Workflow** | `Machine Learning for Clinical Risk Intelligence` | 8-step progression from patient data ingestion to audit commit. Displays champion Random Forest, SVM (RBF), and AdaBoost benchmarks, with prominent safety disclaimer. |
| **Real-Time** | `Real-Time Clinical Intelligence` | Details sub-20ms latency updates for vitals ingestion, predictions, and escalations via Django Channels & Redis. |
| **Security** | `Secure by Design` | Details RBAC, object-level authorization, context minimization, and encryption at rest/in transit. |
| **Data Flow** | `End-to-End Clinical Data Flow` | Clear 8-node visual from Care Team to Neon DB and Physician Sign-Off. |
| **FAQ** | `Common Questions About Our Features` | Accessible Radix UI Accordion answering the 8 canonical clinical and technical questions. |
| **CTA** | `See Intelligent Clinical Decision Support in Action` | Primary action leading to `/dashboard` and secondary action to institutional email contact. |

---

## 4. Strict White-Only Design System

The entire page strictly adheres to the white/light theme standard:
- **Backgrounds:** `#ffffff`, `bg-slate-50/70`, `bg-teal-50/50`
- **Text:** Slate-950 (headers), Slate-600 (body), Slate-400 (captions), Teal-700 (accents)
- **Borders:** `border-slate-200`, `border-teal-200`
- **Zero Dark Classes:** Verified by automated tests scanning for `dark:` class patterns.

---

## 5. Verification & Tests

A dedicated automated test suite `frontend/tests/featuresPage.test.mjs` verifies:
1. Route presence and SEO metadata schema (`Title`, `Description`, `canonical`).
2. Component presence and export integrity.
3. Centralized navigation in `src/config/navigation.ts`.
4. Centralized feature datasets in `src/config/features.ts`.
5. Clinical safety invariants (human-in-the-loop, non-autonomous diagnosis).
6. Strict White/Light Theme policy (zero `dark:` classes).
