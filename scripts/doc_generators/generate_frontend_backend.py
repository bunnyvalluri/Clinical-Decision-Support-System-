"""
Generator for docs/frontend/ and docs/backend/
"""
from pathlib import Path

DOCS_DIR = Path(r"c:\4-1\docs")


def write_file(rel_path: str, content: str):
    p = DOCS_DIR / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Created {rel_path} ({len(content)} chars)")


def generate():
    # =============================================================
    # docs/frontend/ (8 files)
    # =============================================================
    write_file("frontend/overview.md", """
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
""")

    write_file("frontend/setup.md", """
# Frontend Setup & Local Development

This guide explains how to install dependencies, configure environment variables, and run the Next.js frontend application.

---

## 1. Prerequisites

- **Node.js:** `v20.x` or `v22.x` (LTS)
- **Package Manager:** `npm` (v10+)
- **Backend API:** Daphne ASGI server running on `http://localhost:8000`

---

## 2. Installation Steps

1. Navigate to the frontend directory:
   ```bash
   cd c:/4-1/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   NEXT_PUBLIC_APP_NAME="PatientRisk CDSS"
   ```
4. Start development server with Turbopack:
   ```bash
   npm run dev
   ```
5. Open browser at `http://localhost:3000`.

---

## 3. Production Build & Validation

To compile the optimized standalone production build:
```bash
# Type check without emitting files
npm run type-check

# Compile production bundle
npm run build

# Start production standalone runner
npm run start
```
""")

    write_file("frontend/architecture.md", """
# Frontend Architecture & Routing

The frontend utilizes the **Next.js 16 App Router** with a feature-based modular directory structure.

---

## 1. Route Map

| URL Path | App Router Location | Access Permission | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | High-impact clinical landing page with hero brand emblem |
| `/login` | `src/app/login/page.tsx` | Public | Clinician sign-in with 1-click role demo buttons |
| `/register` | `src/app/register/page.tsx` | Public | Staff registration form with department selection |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Public | Self-service password recovery flow |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated | Live clinical telemetry command center |
| `/patients` | `src/app/patients/page.tsx` | Clinician / Staff | Patient directory table with search, MRN filtering |
| `/patients/[id]` | `src/app/patients/[id]/page.tsx`| Clinician / Staff | Longitudinal patient record & historical predictions |
| `/clinical/new` | `src/app/clinical/new/page.tsx` | Clinician / Nurse | Serial vitals and laboratory measurement entry form |
| `/predictions` | `src/app/predictions/page.tsx` | Clinician | Historical risk predictions list with status filters |
| `/predictions/new` | `src/app/predictions/new/page.tsx` | Clinician | Interactive risk prediction request form |
| `/predictions/[id]`| `src/app/predictions/[id]/page.tsx` | Clinician | Detailed SHAP factor explanation & override modal |
| `/reports` | `src/app/reports/page.tsx` | Clinician / Admin | Discharge summary generator & PDF download hub |
| `/notifications` | `src/app/notifications/page.tsx` | Authenticated | Emergency risk alert triage center |
| `/profile` | `src/app/profile/page.tsx` | Authenticated | Clinician credentials and department settings |
| `/admin/models` | `src/app/admin/models/page.tsx` | Administrator | ML model registry management & latency telemetry |

---

## 2. Layout Hierarchy (`Shell.tsx`)

Every authenticated route is wrapped in the universal [Shell.tsx](file:///c:/4-1/frontend/src/components/layout/Shell.tsx) component, which provides:
- Responsive desktop sidebar and mobile drawer.
- PatientRisk brand logo header with dynamic WebSocket status badge (`WS ACTIVE` vs `OFFLINE`).
- Top action bar featuring global patient MRN search and live system clock.
- Notification bell dropdown reflecting unread real-time emergency alerts.
- User profile footer with fast role switcher for demonstration and multi-clinician workflows.
""")

    write_file("frontend/components.md", """
# Reusable UI Component Library

The frontend implements a strictly typed, headless-inspired UI component library located in `frontend/src/components/ui/`.

---

## 1. Component Catalog

### 1.1 `Button` (`components/ui/button.tsx`)
Supports 6 visual variants (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) and 4 sizes (`sm`, `md`, `lg`, `icon`), with built-in loading spinners.

### 1.2 `Badge` (`components/ui/badge.tsx`)
Displays clinical risk tiers with color-coded tokens and optional pulsing indicator dots:
- `LOW`: Green background (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`)
- `MEDIUM`: Amber background (`bg-amber-500/10 text-amber-400 border-amber-500/20`)
- `HIGH`: Rose background (`bg-rose-500/10 text-rose-400 border-rose-500/20`)
- `CRITICAL`: Purple background (`bg-purple-500/10 text-purple-400 border-purple-500/20`)

### 1.3 `Modal` (`components/ui/modal.tsx`)
Accessible dialogue overlay supporting keyboard ESC dismissal, focus trapping, backdrop blur, and custom action footers (used for Clinician Overrides and confirmation dialogs).

### 1.4 `Table` (`components/ui/table.tsx`)
Paginated, sortable clinical data table with responsive horizontal scrolling, sticky header rows, and empty/loading state slots.

### 1.5 `Card` (`components/ui/card.tsx`)
Glassmorphism cards with subtle border highlights (`border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md`).

### 1.6 `Chart` (`components/ui/chart.tsx`)
Responsive SVG charts visualizing risk distributions, 24-hour prediction activity, and latency trends.
""")

    write_file("frontend/state-management.md", """
# State Management

The frontend utilizes **Zustand** for lightweight, predictable, and boilerplate-free state management.

---

## 1. Store Inventory

### 1.1 `useAuthStore` (`features/auth/authStore.ts`)
Manages authentication state, user metadata, and active role:
- `user`: Authenticated user profile (`id`, `email`, `role`, `department`).
- `tokens`: Access and refresh JWT strings.
- `loginAsRole(role)`: Instantly switches active demo clinician persona (`DOCTOR`, `NURSE`, `ADMIN`).
- `logout()`: Clears tokens, terminates WebSocket connections, and redirects to `/login`.

### 1.2 `useClinicalStore` (`features/clinical/clinicalStore.ts`)
Manages active clinical domain state and real-time event updates:
- `predictions`: Array of recent prediction summaries.
- `notifications`: Unread and historical triage notifications.
- `unreadAlertsCount`: Counter for emergency risk badges.
- `handleWebSocketPrediction(payload)`: Optimistically inserts incoming prediction at top of feed without page reload.
- `handleWebSocketAlert(payload)`: Pushes urgent alert notification to state.
- `handleWebSocketTask(payload)`: Updates background report compilation progress (0% -> 100%).
""")

    write_file("frontend/api-integration.md", """
# API Integration & HTTP Client

The frontend communicates with the Django REST Framework API through a centralized Axios client configured with automatic JWT rotation and error normalization.

---

## 1. Axios Client Configuration (`lib/api.ts`)

```typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

---

## 2. Request & Response Interceptors

### Request Interceptor
Automatically injects the Bearer JWT token into the `Authorization` header if available in `authStore`.

### Response Interceptor (Auto-Refresh)
When an API call returns `401 Unauthorized`:
1. The interceptor pauses pending requests.
2. Dispatches a token refresh request to `POST /api/v1/auth/token/refresh/`.
3. If successful, updates the access token in `authStore` and retries the original request.
4. If refresh fails, flushes the auth store and redirects the user to `/login`.
""")

    write_file("frontend/websocket-integration.md", """
# WebSocket Integration

Real-time bidirectional communication is managed by the custom `useWebSocket` hook located in `frontend/src/hooks/useWebSocket.ts`.

---

## 1. WebSocket Hook Lifecycle

```typescript
export function useWebSocket({
  path = "dashboard/",
  handlers = {},
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions)
```

### Connection Strategy
1. **Endpoint Resolution:** Derives WebSocket URL dynamically from `NEXT_PUBLIC_WS_URL` or window location (`ws://` vs `wss://`).
2. **Authentication Handshake:** Passes the active access JWT in the connection query parameters: `?token=<access_token>`.
3. **Heartbeat & Keepalive:** Sends periodic `ping` frames to keep edge proxies and Nginx tunnels alive.
4. **Exponential Backoff Reconnect:** In the event of network disconnection, the hook attempts reconnection with exponential backoff and jitter, transitioning UI state through `CONNECTING` -> `OPEN` -> `CLOSED`.
""")

    write_file("frontend/ui-ux-guidelines.md", """
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
""")

    # =============================================================
    # docs/backend/ (9 files)
    # =============================================================
    write_file("backend/overview.md", """
# Backend Overview

The backend of the **PatientRisk Clinical Decision Support System** is an enterprise Python application built with **Django 5.0** and **Django REST Framework (DRF)**, served by the **Daphne ASGI** server.

---

## 1. Key Engineering Attributes

1. **Strict Separation of Concerns:** Business logic, data access, HTTP serialization, and real-time broadcasting are decoupled into discrete layers.
2. **ASGI-First Concurrency:** Daphne executes asynchronous event loops, allowing long-lived WebSockets and high-throughput REST APIs to share a unified port and routing table.
3. **Enterprise Domain Models:** Normalized schema isolating patient master demographics from high-frequency vital sign encounters.
4. **Defensive Clinical Design:** All nullable vitals and biomarkers are sanitized with clinically sound fallbacks to prevent runtime crashes during urgent triage.
""")

    write_file("backend/setup.md", """
# Backend Setup & Local Development

This guide covers local environment setup, virtual environments, database migrations, and development server execution.

---

## 1. Prerequisites

- **Python:** `3.13` (or `3.11+`)
- **Neon Cloud PostgreSQL:** Valid connection string (`DATABASE_URL`)
- **Redis:** Redis 7 running locally or via Docker (`redis://localhost:6379/0`)

---

## 2. Installation Steps

1. Navigate to the backend directory:
   ```bash
   cd c:/4-1/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\\venv\\Scripts\\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` in the repository root or backend folder:
   ```env
   DJANGO_SETTINGS_MODULE=config.settings.development
   DATABASE_URL=postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require
   REDIS_URL=redis://localhost:6379/0
   CELERY_BROKER_URL=redis://localhost:6379/0
   SECRET_KEY=dev-secret-key-change-in-prod
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the Daphne ASGI server:
   ```bash
   python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```
""")

    write_file("backend/django-architecture.md", """
# Django Architecture & Settings

The backend configuration is partitioned into modular settings files located in `backend/config/settings/`.

---

## 1. Settings Hierarchy

- `base.py`: Universal configuration (installed apps, middleware, authentication backends, REST framework policies, JWT lifetimes, and channel layer routing).
- `development.py`: Enables debug toolbar, verbose logging, and in-memory test cache.
- `production.py`: Enforces HTTPS redirection, secure cookies, strict HSTS, Neon pooled database engine, and JSON structured logging.

---

## 2. Middleware Pipeline

Incoming requests traverse the custom middleware pipeline defined in `apps.core.middleware`:
1. `SecurityMiddleware`: Standard Django security headers.
2. `CorsMiddleware`: Validates cross-origin requests against `CORS_ALLOWED_ORIGINS`.
3. `RequestLoggingMiddleware`: Assigns a unique correlation ID (`X-Request-ID`) to each request and measures execution latency in milliseconds.
4. `AuthenticationMiddleware`: Populates `request.user` via JWT validation.
5. `MetricsMiddleware`: Records response status codes and elapsed time into the in-memory `MetricsRegistry`.
""")

    write_file("backend/apps.md", """
# Backend Apps & Domain Models

The application is structured into domain-specific Django apps inside `backend/apps/`.

---

## 1. App Inventory

| App Name | Package Path | Primary Models / Entities | Purpose |
|---|---|---|---|
| **accounts** | `apps.accounts` | `User`, `Role`, `Department` | Authentication, RBAC roles, clinician profiles |
| **patients** | `apps.patients` | `Patient` | Master patient demographics, MRN generation, soft delete |
| **clinical** | `apps.clinical` | `ClinicalRecord` | Serial encounter observations, vitals, lab biomarkers |
| **predictions** | `apps.predictions` | `Prediction`, `PredictionExplanation` | Risk predictions, confidence scores, SHAP values, overrides |
| **model_registry**| `apps.model_registry` | `ModelVersion` | Registered models, active status, accuracy benchmarks |
| **reports** | `apps.reports` | `Report` | Medical discharge summaries, compilation status, file paths |
| **notifications**| `apps.notifications`| `Notification` | Emergency alerts, notification delivery channels |
| **core** | `apps.core` | `AuditLog`, `SoftDeleteModel` | Base entities, immutable audit logging, metrics registry |
""")

    write_file("backend/services.md", """
# Backend Service Layer

The Service Layer acts as an intermediary between REST views and data access layers, encapsulating all business logic, transactions, and event dispatches.

---

## 1. Service Catalog

### 1.1 `PredictionService` (`services/prediction_service.py`)
- Coordinates real-time risk predictions for a patient.
- Fetches recent encounter vitals through `DjangoPredictionRepository`.
- Executes model inference via `ModelLoaderService`.
- Extracts SHAP factor attributions via `ExplanationService`.
- Persists results atomically in PostgreSQL.
- Publishes real-time prediction and emergency alert events to Redis channel layers.
- Records physician overrides with mandatory textual justifications.

### 1.2 `ExplanationService` (`services/explanation_service.py`)
- Formats TreeSHAP values into clinical risk factors.
- Generates natural language explanations (e.g., *"Elevated systolic blood pressure (172 mmHg) increases cardiovascular risk"*).
- Attaches the standard institutional clinical disclaimer.

### 1.3 `ModelLoaderService` (`services/model_loader.py`)
- Manages an in-memory thread-safe singleton cache of the active scikit-learn model pipeline.
- Provides sub-millisecond model retrieval for runtime inference.
- Exposes `invalidate_cache()` to reload models when a new version is promoted.
""")

    write_file("backend/serializers.md", """
# Serializers & Input Validation

DRF serializers enforce strict schema validation, type casting, and output filtering.

---

## 1. Serializer Design Patterns

1. **Separation of Read and Write:** Complex entities provide dedicated request and response serializers (e.g., `ReportCreateRequestSerializer` vs `ReportSerializer`).
2. **Defensive Range Validation:** `ClinicalRecordSerializer` enforces physiological boundaries:
   - Systolic BP: 50 – 300 mmHg
   - Diastolic BP: 30 – 200 mmHg
   - Heart Rate: 20 – 300 bpm
   - Oxygen Saturation: 50.0 – 100.0 %
3. **Enveloped Response Formatting:** APIs return uniform payloads:
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": { "timestamp": "2026-09-13T16:00:00Z" }
   }
   ```
""")

    write_file("backend/permissions.md", """
# Permissions & Authorization

The backend implements custom DRF permission classes in `apps.accounts.permissions` and `apps.core.permissions`.

---

## 1. Permission Matrix

| Permission Class | Target User | Permitted Actions |
|---|---|---|
| `IsClinician` | `DOCTOR`, `CLINICIAN` | Create patients, request predictions, record clinical overrides, generate discharge summaries |
| `IsNurse` | `NURSE` | Log patient vitals, view ward telemetry alerts |
| `IsStaffUser` | `ADMIN`, `CLINICIAN`, `NURSE` | Access general clinical records |
| `IsAdminUser` | `ADMIN` | Manage users, view audit logs, promote ML model versions |
| `IsPatientOwner` | `PATIENT` | Retrieve only the patient's own profile and predictions |

Horizontal privilege escalation is strictly prevented by scoping querysets to the authenticated user's authorized patients.
""")

    write_file("backend/error-handling.md", """
# Error Handling & Exceptions

The system utilizes a centralized custom exception handler (`apps.core.exceptions.custom_exception_handler`) to ensure consistent, predictable error responses.

---

## 1. Standard Error Envelope

When an error occurs, the API returns a structured JSON payload:
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Invalid clinical vital measurements.",
    "details": {
      "systolic_bp": ["Systolic blood pressure must be <= 300 mmHg."]
    }
  }
}
```

---

## 2. HTTP Status Code Mapping

- `400 Bad Request`: Malformed JSON or syntax errors.
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: User lacks necessary clinical role or permissions.
- `404 Not Found`: Target patient, record, or model version does not exist.
- `422 Unprocessable Entity`: Semantic validation failure (e.g., impossible vitals).
- `500 Internal Server Error`: Unhandled system exception (logged with stack trace).
""")

    write_file("backend/configuration.md", """
# Configuration & Environment Variables

All backend settings are externalized and configured through environment variables.

---

## 1. Essential Configuration Keys

```env
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=production-crypto-key
ALLOWED_HOSTS=cdss.hospital.org,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://cdss.hospital.org

# Neon Cloud PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:pass@ep.neon.tech/neondb?sslmode=require

# Redis & Channels
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer

# Celery Background Processing
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
CELERY_WORKER_CONCURRENCY=4

# Telemetry & Logging
LOG_LEVEL=INFO
ENABLE_STRUCTURED_JSON_LOGGING=True
```
""")

    print("Generated frontend and backend documentation.")


if __name__ == "__main__":
    generate()
