# HealthNova AI — UI Development Guidelines & Component Authoring

Guidelines for software engineers creating or updating components within the HealthNova AI design system.

---

## 1. Where Does Code Belong?

```
src/
├── components/
│   ├── ui/          <-- GENERIC PRIMITIVES ONLY (shadcn/Radix). NO patient concepts!
│   ├── clinical/    <-- CLINICAL DESIGN SYSTEM (RiskBadge, VitalCard, Timeline).
│   ├── ai/          <-- AI PROVENANCE & REVIEW (Chat, ToolCall, ModelManager).
│   ├── layout/      <-- APPLICATION SHELL & ROLES (Shell, Breadcrumbs, Guards).
│   └── search/      <-- MEILISEARCH COMPONENTS.
├── features/        <-- DOMAIN FEATURE CODE (Zustand stores, API wiring).
└── app/             <-- NEXT.JS APP ROUTER PAGES (Route handlers, layouts).
```

---

## 2. Rules for Generic Primitives (`components/ui/*`)

1. **Keep Primitives Agnostic:** Never reference `patientId`, `riskScore`, or medical records inside `components/ui/button.tsx` or `card.tsx`.
2. **Use CVA for Variants:** Implement `class-variance-authority` for variant and size dispatch.
3. **Always Forward Refs:** All primitives must wrap elements in `React.forwardRef` and set `displayName`.
4. **Use `cn` Utility:** Merge classes using `@/lib/utils.ts` (`twMerge(clsx(inputs))`).
5. **Ensure Full Typing:** Define strict TypeScript interfaces; avoid `any`.

---

## 3. Rules for Clinical Components (`components/clinical/*`)

1. **High-Contrast Light Theme Only:** Never introduce dark classes or low-contrast background fills.
2. **Three-Way Redundancy:** Statuses must feature text, icon, and distinct badge styling.
3. **No Fake Fallback Data:** If props are undefined or missing from Django, render an explicit loading skeleton or truthful empty state.
4. **Human Review Disclaimers:** Never imply that an AI recommendation or risk score is an autonomous medical prescription.

---

## 4. Quality Gate Checklist Before Commit

Every UI change must satisfy the **Production-Ready Quality Gate**:

- [ ] `npm run type-check`: 0 TypeScript errors.
- [ ] `npm test`: All tests in test suite pass.
- [ ] `node --test tests/shadcnDesignSystem.test.mjs`: Zero dark-mode classes and 100% token adherence.
- [ ] `npm run doctor`: React Doctor scan confirms no missing accessible labels or unowned async state leaks.
- [ ] Responsive check: Works seamlessly on mobile (375px), tablet (768px), and desktop (1440px).
