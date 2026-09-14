# Next.js Application Architecture

## 1. Directory Structure

The frontend application follows Next.js App Router conventions with domain-driven clinical feature isolation:

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router (Pages, Layouts)
│   │   ├── (auth)/               # Login, register, reset-password
│   │   ├── user/                 # Patient / User Portal (20+ routes)
│   │   ├── doctor/               # Physician / Doctor Portal (12+ routes)
│   │   ├── nurse/                # Nurse Care Team Portal (13+ routes)
│   │   ├── informaticist/        # Medical Informaticist Portal (14+ routes)
│   │   ├── admin/                # IT Administrator Portal (20+ routes)
│   │   ├── forbidden/            # Auto-redirect bypass
│   │   ├── layout.tsx            # Global Root Layout
│   │   └── page.tsx              # Root Home Landing / Auto-Routing
│   ├── components/
│   │   ├── layout/               # Shell, Header, Sidebar, Breadcrumbs, RoleGuard
│   │   ├── responsive/           # ResponsiveAppShell, ResponsiveModal, ResponsiveTable
│   │   └── ui/                   # Reusable UI primitives (Button, Card, Badge, etc.)
│   ├── features/                 # Modular domain workspaces
│   │   ├── ai/                   # Clinical intelligence & LLM assistant panels
│   │   ├── clinical/             # Clinical Zustand store & business logic
│   │   └── workspaces/           # Role-specific dashboard workspaces
│   ├── hooks/                    # Custom hooks (WebSockets, responsive breakpoints, auth)
│   ├── lib/                      # Route configs, utilities, role validation matrices
│   ├── services/                 # API client, WebSocket clients, clinical data types
│   └── types/                    # Shared TypeScript domain models
├── tests/                        # Route matrix unit tests
├── middleware.ts                 # Next.js Edge proxy and route guard
├── next.config.ts                # Next.js 16 configuration with Turbopack root
└── package.json                  # Dependencies, scripts, and build configuration
```

---

## 2. Role Isolation Matrix

The application guarantees isolation across the 5 healthcare user roles through `src/lib/roleRoutes.ts`:

| User Role | Home Dashboard | Allowed Path Prefix | Fallback on Unauthorized Route |
| :--- | :--- | :--- | :--- |
| **PATIENT** | `/user/dashboard` | `/user/*` | `/user/dashboard` |
| **DOCTOR** | `/doctor/dashboard` | `/doctor/*`, `/patients/*`, `/predictions/*` | `/doctor/dashboard` |
| **NURSE** | `/nurse/dashboard` | `/nurse/*`, `/patients/*` | `/nurse/dashboard` |
| **MEDICAL_INFORMATICIST** | `/informaticist/dashboard` | `/informaticist/*`, `/predictions/*` | `/informaticist/dashboard` |
| **IT_ADMIN** | `/admin/dashboard` | `/admin/*` | `/admin/dashboard` |

### Route Resolution Engine
- `isRouteAllowedForRole(pathname, role)`: Deterministically compares current URL against parameterized route patterns (e.g. `/nurse/patients/:patientId/vitals`).
- `getRoleDashboard(role)`: Maps raw role strings to authorized dashboard roots.
- `resolveRoleRedirect(pathname, role)`: Computes the target URL when an unauthorized path is accessed, preventing navigation to unauthorized role pages.

---

## 3. State Management & Real-Time Sync

### 3.1 Client State Architecture
- **Zustand (`clinicalStore.ts`)**: Manages high-frequency clinical data, patient lists, prediction records, live vital metrics, and notifications with optimistic updates.
- **React Context (`AuthContext.tsx`)**: Manages authenticated session identity, JWT refresh cycles, and role claims.

### 3.2 Real-Time WebSockets
- Connected to Django Channels backend (`/ws/user/`, `/ws/clinical/`).
- Dispatches real-time events (`user.notification.created`, `clinical.vital.updated`, `risk.prediction.alert`) directly into Zustand stores.
