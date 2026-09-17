# HealthNova AI — Theming & Design Tokens

> **Architecture Non-Negotiable:** The application is STRICT WHITE / LIGHT THEME ONLY.  
> Dark mode, system theme detection (`prefers-color-scheme: dark`), and theme switchers are permanently prohibited.

---

## 1. Core Semantic Tokens (`:root`)

Defined in `src/app/globals.css` and bound to Tailwind CSS v4 via `@theme inline`:

```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;

  --card: #ffffff;
  --card-foreground: #0f172a;

  --popover: #ffffff;
  --popover-foreground: #0f172a;

  --primary: #0284c7;
  --primary-hover: #0369a1;
  --primary-foreground: #ffffff;

  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;

  --muted: #f8fafc;
  --muted-foreground: #64748b;

  --accent: #f8fafc;
  --accent-foreground: #0f172a;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #0284c7;

  --radius: 0.75rem;

  /* Clinical Status Tokens */
  --success: #059669;
  --success-foreground: #ffffff;
  --warning: #d97706;
  --warning-foreground: #ffffff;
  --error: #ef4444;
  --error-foreground: #ffffff;
  --info: #0284c7;
  --info-foreground: #ffffff;
  --neutral: #64748b;
  --neutral-foreground: #ffffff;

  /* Clinical Risk Tiers */
  --risk-low: #059669;
  --risk-low-bg: #ecfdf5;
  --risk-low-border: #a7f3d0;

  --risk-medium: #d97706;
  --risk-medium-bg: #fffbeb;
  --risk-medium-border: #fde68a;

  --risk-high: #e11d48;
  --risk-high-bg: #fff1f2;
  --risk-high-border: #fecdd3;

  --risk-critical: #7e22ce;
  --risk-critical-bg: #faf5ff;
  --risk-critical-border: #e9d5ff;
}
```

---

## 2. Strict Light Mode Enforcement

The root HTML element enforces light mode regardless of operating system or browser settings:

```css
html {
  color-scheme: light !important;
  background-color: #f8fafc !important;
}

body {
  background-color: #f8fafc !important;
  color: #0f172a !important;
}
```

Any attempt to introduce `dark:` variant utility classes into application source code is caught by `tests/shadcnDesignSystem.test.mjs` during automated testing and CI.
