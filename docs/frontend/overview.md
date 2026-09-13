# Frontend Overview

The frontend of the **PatientRisk Clinical Decision Support System** is an enterprise-grade medical workstation application engineered to present complex machine learning insights, real-time vital sign telemetry, and explainability attributions with zero UI friction.

---

## 1. UI/UX Philosophy

1. **High Contrast & Clarity:** Utilizes a dark-mode clinical color palette (`zinc-950` canvas, `zinc-900` cards, and curated HSL accents) to minimize eye fatigue during extended clinical shifts in ICU and emergency settings.
2. **Clinical Urgency Hierarchy:** Standardized color tokens immediately communicate risk levels across all widgets:
   - **LOW Risk:** Emerald (`#10b981`)
   - **MEDIUM Risk:** Amber (`#f59e0b`)
   - **HIGH Risk:** Rose (`#f43f5e`)
   - **CRITICAL Risk:** Purple / Crimson (`#a855f7`)
3. **Zero Page-Reload Telemetry:** All clinical vital streams, new predictions, and task notifications update live in the DOM via WebSockets without triggering full page reloads or layout shifts.
4. **Physician Safety & Governance:** Automated AI recommendations are paired with prominent clinical disclaimers and immediate access to the **Clinician Override Dialog**.
