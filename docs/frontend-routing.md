# Frontend Role-Isolated Routing Architecture

## Overview
The Clinical Decision Support System (CDSS) comprises five specialized clinical and operational workspaces:
1. **User / Patient Portal** (`/user/*` → `/user/dashboard`)
2. **Physician / Doctor Workspace** (`/doctor/*` → `/doctor/dashboard`)
3. **Nurse Triage & Bedside Workspace** (`/nurse/*` → `/nurse/dashboard`)
4. **Medical Informatics & MLOps Workspace** (`/informaticist/*` → `/informaticist/dashboard`)
5. **IT System Administration Workspace** (`/admin/*` → `/admin/dashboard`)

The application enforces **clean role-isolated routing**. There are no dedicated "Access Denied" or 403 Forbidden pages presented to users during normal application navigation or URL entry. When an authenticated user requests a route belonging to another role, they are **automatically and seamlessly redirected to their own authorized dashboard**.

---

## Role Redirect Matrix

| Authenticated Role | Requested Route | Seamless Destination | Error Screen Rendered? |
| :--- | :--- | :--- | :--- |
| **DOCTOR** | `/nurse/*`, `/user/*`, `/informaticist/*`, `/admin/*` | `/doctor/dashboard` | **None (0s flash)** |
| **NURSE** | `/doctor/*`, `/user/*`, `/informaticist/*`, `/admin/*` | `/nurse/dashboard` | **None (0s flash)** |
| **PATIENT / USER** | `/doctor/*`, `/nurse/*`, `/informaticist/*`, `/admin/*` | `/user/dashboard` | **None (0s flash)** |
| **MEDICAL INFORMATICIST** | `/doctor/*`, `/nurse/*`, `/user/*`, `/admin/*` | `/informaticist/dashboard` | **None (0s flash)** |
| **IT ADMIN** | `/doctor/*`, `/nurse/*`, `/user/*`, `/informaticist/*` | `/admin/dashboard` | **None (0s flash)** |
| **Unauthenticated** | Any protected role route | `/login` | **None** |

---

## Centralized Role Route Configuration

The single source of truth for routing resides in [`frontend/src/lib/roleRoutes.ts`](file:///c:/4-1/frontend/src/lib/roleRoutes.ts):

```typescript
export const roleRouteConfig = {
  user: {
    basePath: "/user",
    dashboard: "/user/dashboard",
    roles: ["PATIENT"],
    displayName: "Patient Health Portal",
  },
  doctor: {
    basePath: "/doctor",
    dashboard: "/doctor/dashboard",
    roles: ["DOCTOR"],
    displayName: "Physician Workspace",
  },
  nurse: {
    basePath: "/nurse",
    dashboard: "/nurse/dashboard",
    roles: ["NURSE"],
    displayName: "Triage & Bedside",
  },
  informaticist: {
    basePath: "/informaticist",
    dashboard: "/informaticist/dashboard",
    roles: ["MEDICAL_INFORMATICIST", "ANALYST"],
    displayName: "Medical Informatics",
  },
  admin: {
    basePath: "/admin",
    dashboard: "/admin/dashboard",
    roles: ["IT_ADMIN", "ADMIN"],
    displayName: "Hospital Administration",
  },
};
```

---

## Defense-in-Depth Enforcement

### 1. Edge Middleware (`middleware.ts`)
Executes at the Next.js Edge Runtime before server rendering:
- Reads the secure `clinical_role` cookie set upon authentication.
- For unauthorized role namespaces, intercepts the request and issues an HTTP 307 redirect immediately to `getRoleDashboard(roleCookie)`.
- If an unauthenticated user attempts to access any role namespace, redirects directly to `/login`.
- If an authenticated user visits `/login` or `/register`, immediately forwards them to their authorized dashboard.
- Intercepts any direct or bookmark hits to `/forbidden`, forwarding authenticated clinicians to their dashboard.

### 2. Client-Side Guards (`RoleGuard.tsx`)
Wraps each role's root layout (`DoctorLayout`, `NurseLayout`, `InformaticistLayout`, `AdminLayout`, `UserLayout`):
- Checks Zustand `authStore` hydration state.
- If `!requiredRoles.includes(user.role)`, immediately executes `router.replace(getRoleDashboard(user.role))` to eliminate browser history loops.
- Displays a neutral clinical verification spinner (`Verifying authorized workspace…`) during the evaluation window without flashing unauthorized content or error messages.

### 3. Role-Isolated Navigation Layouts
- **Desktop Sidebar**: Only renders navigation items explicitly mapped to the active role.
- **Mobile Floating Navigation**: Only renders the 5 authorized quick items for the role (e.g. Doctor: Home, Patients, Predictions, Reviews, Profile; Nurse: Home, Triage, Patients, Alerts, Profile).
- **Breadcrumbs**: Root Home icon dynamically links to the user's authorized role dashboard (`getRoleDashboard(user?.role)`), preventing navigation leaks.

---

## Route Registry Specification

Every role maintains an explicit list of authorized route templates and parameterized paths (e.g. `:patientId`, `:predictionId`, `:triageId`):
- Parameter matching uses `matchRoutePattern(pattern, pathname)` to accurately support deep links (e.g. `/doctor/patients/p-101/timeline`).

---

## Testing & Verification
Automated test suite is maintained in [`frontend/tests/roleRoutes.test.mjs`](file:///c:/4-1/frontend/tests/roleRoutes.test.mjs) and run via:
```bash
npm run test:routes
```
All 11 tests verifying the 5x5 redirect matrix, parameterized nested paths, and unauthenticated behavior pass deterministically.
