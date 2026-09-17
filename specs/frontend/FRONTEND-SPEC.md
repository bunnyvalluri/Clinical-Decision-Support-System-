# Frontend Specification: Next.js & shadcn/ui

**Spec ID**: `FE-SPEC-001`  
**Domain**: Presentation, Portals, Design System, & Accessibility  
**Status**: `CONVERGED`  
**Framework**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui  

---

## 1. Constitutional Design Rule: Strict White / Light Theme Only

> [!IMPORTANT]
> The CDSS user interface **MUST REMAIN WHITE / LIGHT THEME ONLY**.
> - **Forbidden**: Dark mode, dark theme, system theme auto-switching (`prefers-color-scheme`), dark-mode toggles, `dark:` Tailwind classes, and dark background palettes (`#000000`, `#0f172a`, `#18181b`).
> - **Approved Palette**: Pure clinical white (`#ffffff`), soft clinical slate background (`#f8fafc`), border accents (`#e2e8f0`), deep slate typography (`#0f172a`, `#334155`), and accessible teal/blue status indicators (`#0284c7`, `#059669`, `#dc2626`).

---

## 2. Five Sovereign Portals & Mobile Navigation

The frontend guarantees absolute data separation across five dedicated portals:

| Portal | Root Route | Desktop Layout | Mobile 5-Item Navigation Bar |
| :--- | :--- | :--- | :--- |
| **Patient** | `/user/*` | Patient Dashboard Sidebar | Home, Health, Risk, Messages, Profile |
| **Doctor** | `/doctor/*` | Clinical Cohort Sidebar | Home, Patients, Predictions, Reviews, Profile |
| **Nurse** | `/nurse/*` | Triage & Bedside Sidebar | Home, Triage, Patients, Alerts, Profile |
| **Informaticist** | `/informaticist/*` | MLOps & Quality Sidebar | Home, Data, Models, Analytics, Profile |
| **Admin** | `/admin/*` | System Operations Sidebar | Home, Users, Services, Security, Profile |

---

## 3. UI Quality & Accessibility Standards

1. **Accessibility (WCAG 2.1 AA)**:
   - Full keyboard navigation with visible focus rings (`focus-visible:ring-2`).
   - Semantic HTML5 elements (`<main>`, `<nav>`, `<article>`, `<section>`, `<header>`).
   - Descriptive ARIA attributes on all interactive modals, popovers, and tables.
2. **Component Reuse**:
   - Reuses approved shadcn/ui components (`Button`, `Card`, `Badge`, `Dialog`, `Table`, `Tabs`, `Alert`).
   - Ad-hoc, unreviewed UI libraries are strictly forbidden.
3. **Quality Gates**:
   - Every frontend modification must pass React Doctor analysis (`npx react-doctor`) with zero critical errors.
