# UI/UX & Accessibility Guidelines

This document outlines the visual design system, typography, and accessibility standards for the PatientRisk CDSS frontend.

---

## 1. Visual Hierarchy & Typography

- **Font Family:** `Geist` (primary sans-serif) and `Geist Mono` (for vitals, MRNs, and telemetry counters).
- **Dark Canvas:** `bg-zinc-950` default background paired with `bg-zinc-900/60` glassmorphism card overlays.
- **Micro-Animations:** Subtle pulse animations on real-time indicators and telemetry badges (`animate-pulse`, `animate-ping`) to signify active background streams without distracting the clinician.

---

## 2. Accessibility (WCAG 2.1 AA)

- **Contrast Ratios:** Text color combinations exceed the 4.5:1 ratio for normal text and 3:1 for large display text.
- **Color Independence:** Clinical risk tiers are never conveyed solely through color; every badge pairs a color token with an explicit text label (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and icon indicator.
- **Screen Reader Support:** Form inputs include explicit `<label>` elements or `aria-label` attributes.
