# HealthNova AI — Accessibility Standards & WCAG 2.1 AA Compliance

Healthcare applications demand impeccable accessibility to ensure that clinicians, nurses, informaticists, and patients can access critical health data under varying lighting, physical, and cognitive conditions.

---

## 1. Non-Color Dependence (Color Blindness Rule)

> **Mandatory Rule:** Clinical information must NEVER rely solely on color to convey meaning (WCAG 1.4.1).

- **Risk Levels:** `RiskBadge` and `RiskLevelCard` use **three simultaneous cues**:
  1. **Text Label:** Explicitly reads "Low Risk", "Medium Risk", "High Risk", or "Critical Risk".
  2. **Dedicated Icon:** Distinct SVG glyphs (`CheckCircle2`, `AlertTriangle`, `AlertCircle`, `ShieldAlert`).
  3. **High-Contrast Background & Border:** Tailored pastel backgrounds with high-contrast foreground text.
- **Biometric Vitals:** `VitalSignCard` renders trend direction arrows (`ArrowUp`, `ArrowDown`, `Minus`) and status text in addition to color accents.

---

## 2. Keyboard Navigation & Focus Management

- **Dialogs & Modals (`Dialog`, `AlertDialog`):**
  - Traps focus inside the modal dialog while open.
  - Automatically focuses the primary interaction or first focusable element.
  - Restores focus to the triggering element upon closure.
  - Closes upon pressing the `Escape` key.
- **Command Palette (`CommandDialog`):**
  - Activated via `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux).
  - Navigable with Up/Down arrows and Enter.
- **Form Controls:**
  - All inputs, textareas, selects, checkboxes, switches, and buttons support standard Tab/Shift-Tab order.
  - Visible focus rings: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

---

## 3. Screen Reader Semantics & ARIA

- **Semantic HTML First:** Standard `<button>`, `<input>`, `<dialog>`, `<nav>`, `<aside>`, `<main>`, `<header>` elements are preferred over `<div>` with click listeners.
- **Alert Regions:** `Alert` and `ClinicalAlert` implement `role="alert"` for assertive screen reader announcement.
- **Progress Bars:** `Progress` implements `aria-label` with percentage value and accessible bounds (`aria-valuemin="0"`, `aria-valuemax="100"`).
- **Icon-Only Buttons:** Icon buttons (e.g. mobile menu trigger, close buttons) include `<span className="sr-only">Label</span>` or explicit `aria-label`.

---

## 4. Reduced Motion Support

In `src/app/globals.css`, the design system strictly obeys user preference for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 5. Automated Accessibility Audits

The project runs automated accessibility audits using:
- `react-doctor`: Evaluates control associations, static element interactions, and dialog semantics.
- Unit test suite: `tests/shadcnDesignSystem.test.mjs` verifies ARIA invariants and zero dark mode styles.
