# HealthNova AI — Enterprise Clinical Design System

> **Standard:** shadcn/ui (New York Style) + Tailwind CSS v4 + Next.js 16 (App Router) + React 19  
> **Theme:** STRICT WHITE / LIGHT THEME ONLY  
> **Authoritative Backend:** Django REST Framework, Neon PostgreSQL, Celery, Channels

---

## 1. Architectural Philosophy

HealthNova AI implements an **application-owned open-code component architecture**. Unlike traditional black-box npm component libraries, UI primitives live directly inside `src/components/ui/`, giving the clinical platform 100% ownership, auditability, and customization control.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 6: Role Pages                             │
│       /doctor/*, /nurse/*, /informaticist/*, /admin/*, /user/*         │
├────────────────────────────────────────────────────────────────────────┤
│                     Layer 5: Feature Components                        │
│   ClinicalIntelligencePanel, NocoDBGridView, ExcalidrawWhiteboard      │
├────────────────────────────────────────────────────────────────────────┤
│                    Layer 4: Clinical Components                        │
│   RiskBadge, RiskLevelCard, VitalSignCard, SHAPExplanation, etc.      │
├────────────────────────────────────────────────────────────────────────┤
│                   Layer 3: Application Primitives                      │
│        Shell, Breadcrumbs, RoleGuard, MobileFloatingNavigation         │
├────────────────────────────────────────────────────────────────────────┤
│                 Layer 2: shadcn/ui UI Primitives                       │
│    Button, Badge, Card, Dialog, Sheet, Table, Command, Select, Form    │
├────────────────────────────────────────────────────────────────────────┤
│                      Layer 1: Design Tokens                            │
│   CSS Variables (:root), Tailwind v4 @theme inline, Clinical Tokens    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariants & Healthcare Non-Negotiables

1. **Strict White-Only Theme**: No dark mode, no dark styles (`dark:`), no theme toggles, and OS dark-mode overrides (`html { color-scheme: light !important }`).
2. **Zero Fake Business Data**: Components never hardcode patient counts, doctor names, risk percentages, or AI explanations. If data is absent, truthful empty states are rendered.
3. **No Direct Backend Bypass**: Presentation components NEVER connect directly to Neon PostgreSQL, Redis, Celery, or Ollama. All interactions route through Django REST or Django Channels.
4. **Separation of Concerns**: Generic UI primitives (`components/ui/*`) must NEVER contain domain logic or patient data structures. Clinical abstractions belong in `components/clinical/`.
5. **Human-in-the-Loop Sign-Off**: AI and classical ML predictions are labeled explicitly as recommendations; final clinical decisions require physician sign-off.

---

## 3. Configuration

Configured via `components.json` in the frontend root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## 4. Component Ownership Matrix

| Domain | Directory | Primary Owner | Review Requirements |
|---|---|---|---|
| **UI Primitives** | `src/components/ui/` | Frontend Platform Team | Accessibility (axe/WAI-ARIA), Responsiveness, TypeScript |
| **Clinical UI** | `src/components/clinical/` | Clinical Informatics UX | Clinical terminology, high-contrast risk colors, PHI masking |
| **AI UI** | `src/components/ai/` | AI/MLOps Engineering | Model provenance labeling, audit trail, human approval gates |
| **Layouts** | `src/components/layout/` | Frontend Platform Team | 5-Role isolation, safe area insets, mobile touch targets |
| **Features** | `src/features/*` | Domain Product Teams | Django API integration, store lifecycle, real-time sync |
