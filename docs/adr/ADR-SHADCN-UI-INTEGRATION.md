# ADR-039: Architecture Decision Record — shadcn/ui Enterprise Integration

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** Principal Frontend Architect, Lead Clinical Informaticist, Chief Security Officer
- **Domain:** Frontend Design System & Component Architecture

---

## 1. Context & Problem Statement

HealthNova AI is an enterprise Clinical Decision Support System combining classical machine learning (SVM, Random Forest, AdaBoost), explainable AI (SHAP), local LLM inference (Ollama), real-time clinical telemetries (Django Channels, Redis), and five specialized role workspaces (Doctor, Nurse, Informaticist, Admin, Patient).

Previously, components had ad-hoc HTML structures, inconsistent focus indicators, and variable styling patterns. The application required an accessible, high-density, production-grade frontend component foundation without introducing bulky external runtime dependencies or compromising the authoritative backend (Django REST, Neon PostgreSQL).

---

## 2. Decision

We have adopted **shadcn/ui** (New York style) as the **authoritative application-owned UI primitive layer**.

Specifically:
1. **Open-Code Architecture:** Components are added directly to `src/components/ui/` in the application source tree. The application owns and customizes the component source code completely.
2. **Tailwind CSS v4 & Next.js 16 Alignment:** Configuration via `components.json` with `@theme inline` in `src/app/globals.css`.
3. **Strict White-Only Theme:** No dark mode or dark-theme CSS classes are permitted in production code.
4. **Radix UI Accessibility Foundation:** Leverages battle-tested WAI-ARIA primitives (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-sheet`, `@radix-ui/react-popover`) for built-in keyboard navigation, focus trapping, and screen-reader semantics.

---

## 3. What shadcn/ui is NOT (Preservation Invariant)

shadcn/ui is strictly a **FRONTEND COMPONENT PRIMITIVE SYSTEM**.

It is **NOT**:
- A backend or API framework.
- A database or state management system.
- An authentication or authorization authority.
- A clinical risk prediction engine or diagnosis authority.
- A replacement for the authoritative Django REST / Neon PostgreSQL architecture.

---

## 4. Design System Governance

### Component Addition Process
1. **Discover & Justify:** Evaluate if an official shadcn/Radix primitive satisfies the requirement.
2. **Review Dependencies:** Security and supply chain audit on any transitive npm dependencies.
3. **Add to Application Tree:** Integrate source into `src/components/ui/` or `src/components/clinical/`.
4. **Enforce Accessibility & White Theme:** Must pass `tests/shadcnDesignSystem.test.mjs` and `npm run doctor`.
5. **Quality Gate:** Merge only with 100% passing TypeScript, route tests, and security tests.

### Component Ownership
- **Generic UI Primitives (`components/ui/*`):** Maintained by Frontend Platform Engineering. Must remain 100% domain-agnostic.
- **Clinical Components (`components/clinical/*`):** Maintained jointly by Clinical Informatics and Frontend Engineering. Enforces clinical terminology, high-contrast risk colors, and human-in-the-loop sign-off workflows.
- **AI Components (`components/ai/*`):** Maintained by AI/MLOps Engineering. Enforces provenance labeling and approval gates.
- **Role Layouts (`components/layout/*`):** Maintained by Security and Frontend teams. Enforces RBAC boundaries.

---

## 5. Consequences

### Positive
- **100% Code Ownership:** Zero risk of breaking changes from upstream library releases.
- **Enterprise Accessibility:** Automatic WCAG 2.1 AA compliance across modal dialogs, sheets, and forms.
- **Zero Monolithic Bundle Bloat:** Only code for installed components is bundled into client pages.
- **Unified Visual Identity:** Cohesive New York style across all 5 clinical user roles.

### Neutral / Trade-offs
- Components are source files in the repo and must be maintained as first-party application code.
