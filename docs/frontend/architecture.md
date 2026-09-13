# Frontend Architecture & Routing

The frontend utilizes the **Next.js 16 App Router** with a feature-based modular directory structure.

---

## 1. Route Map

| URL Path | App Router Location | Access Permission | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | High-impact clinical landing page with hero brand emblem |
| `/login` | `src/app/login/page.tsx` | Public | Clinician sign-in with 1-click role demo buttons |
| `/register` | `src/app/register/page.tsx` | Public | Staff registration form with department selection |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Public | Self-service password recovery flow |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated | Live clinical telemetry command center |
| `/patients` | `src/app/patients/page.tsx` | Clinician / Staff | Patient directory table with search, MRN filtering |
| `/patients/[id]` | `src/app/patients/[id]/page.tsx`| Clinician / Staff | Longitudinal patient record & historical predictions |
| `/clinical/new` | `src/app/clinical/new/page.tsx` | Clinician / Nurse | Serial vitals and laboratory measurement entry form |
| `/predictions` | `src/app/predictions/page.tsx` | Clinician | Historical risk predictions list with status filters |
| `/predictions/new` | `src/app/predictions/new/page.tsx` | Clinician | Interactive risk prediction request form |
| `/predictions/[id]`| `src/app/predictions/[id]/page.tsx` | Clinician | Detailed SHAP factor explanation & override modal |
| `/reports` | `src/app/reports/page.tsx` | Clinician / Admin | Discharge summary generator & PDF download hub |
| `/notifications` | `src/app/notifications/page.tsx` | Authenticated | Emergency risk alert triage center |
| `/profile` | `src/app/profile/page.tsx` | Authenticated | Clinician credentials and department settings |
| `/admin/models` | `src/app/admin/models/page.tsx` | Administrator | ML model registry management & latency telemetry |

---

## 2. Layout Hierarchy (`Shell.tsx`)

Every authenticated route is wrapped in the universal [Shell.tsx](file:///c:/4-1/frontend/src/components/layout/Shell.tsx) component, which provides:
- Responsive desktop sidebar and mobile drawer.
- PatientRisk brand logo header with dynamic WebSocket status badge (`WS ACTIVE` vs `OFFLINE`).
- Top action bar featuring global patient MRN search and live system clock.
- Notification bell dropdown reflecting unread real-time emergency alerts.
- User profile footer with fast role switcher for demonstration and multi-clinician workflows.
