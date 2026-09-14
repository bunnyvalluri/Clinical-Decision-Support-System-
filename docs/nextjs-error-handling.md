# Next.js & Frontend Error Handling Architecture

## Overview

The Clinical Decision Support System implements a defense-in-depth error handling strategy. In critical clinical software, silent failures, unhandled promise rejections, and confusing error screens compromise patient safety and clinical decision-making.

---

## 1. Error Handling Tiers

### Tier 1: Role Mismatch & Route Boundaries
- **Legacy Behavior**: Displaying a full-screen "Access Denied" or `/forbidden` page when an authorized user navigated across role boundaries (e.g., Physician accessing `/nurse/dashboard`).
- **Production Architecture**:
  - Immediate, seamless redirect via `resolveRoleRedirect(pathname, userRole)`.
  - The user is redirected directly to their designated dashboard (`/doctor/dashboard`, `/nurse/dashboard`, etc.) without displaying forbidden banners or error screens.
  - The `/forbidden` route has been replaced with an `AutoRedirect` component that immediately bounces authenticated users back to their role workspace.

### Tier 2: Component-Level Error Boundaries
- Critical clinical modules (Prediction Explorer, Vitals Monitor, Risk Screening, ML Model Evaluation) are wrapped with `ErrorBoundary` components.
- When an unexpected runtime exception occurs:
  1. The error boundary traps the error.
  2. The issue is recorded with contextual telemetry (component name, user role, active patient MRN).
  3. A clean, non-disruptive fallback card allows the clinician to retry or refresh the module without crashing the entire shell.

### Tier 3: API & Network Client Resilience (`apiClient.ts`)
- **Centralized Interceptor**:
  - `401 Unauthorized`: Triggers proactive token refresh or redirects to `/login` if refresh tokens are expired.
  - `403 Forbidden`: Captured cleanly. Dispatches notifications rather than terminating client execution.
  - `500 Server Error` / Network Outage: Captures error logs, preserves cached local state (e.g., Zustand clinical store seed data), and surfaces actionable alerts to the user.
- **Catch Blocks**: Zero empty catch blocks (`try {} catch {}` is prohibited). All exceptions are either surfaced through user-facing alerts or logged via structured warnings (`console.warn` / telemetry).

### Tier 4: WebSocket Disconnection & Reconnection
- The `useUserWebSocket` hook manages channel socket lifecycles:
  - Backoff reconnection algorithm (1s, 2s, 5s, max 30s) prevents server flooding.
  - Connection status transitions (`connecting` -> `connected` -> `reconnecting` -> `offline`) are surfaced via non-blocking status badges in the top navigation.
  - Event dispatchers utilize stable refs (`onEventRef`) to prevent stale closures and memory leaks.

---

## 2. Best Practices for Error Prevention

1. **Avoid Strict Casting**: Never use `as unknown as Type`. Provide fallbacks or narrow types using TypeScript guards.
2. **Defensive Parsing**:
   ```typescript
   // Safe date parsing with fallbacks
   new Date(record.recorded_at || record.encounter_date || Date.now()).toLocaleDateString()
   ```
3. **Safe Metric Formatting**:
   ```typescript
   // Safe numerical display
   typeof metric.score === "number" ? (metric.score * 100).toFixed(1) + "%" : "N/A"
   ```
