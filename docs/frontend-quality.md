# Frontend Engineering Quality & Architectural Standards

## 1. Core Principles & Technology Stack

The CDSS frontend is built with:
- **Next.js 16 (Turbopack)**: App Router architecture with strict server and client component boundaries.
- **React 19**: Leveraging Concurrent Mode, Actions, and compiler optimizations.
- **TypeScript 5 (Strict Mode)**: 100% typed interfaces, zero `any` policy.
- **Pure White/Light Medical Theme**: High contrast, clinical readability, zero dark mode or dark-theme fallbacks.

---

## 2. React 19 Architectural Rules

### 2.1 Pure State Updaters
When using functional state updates `setState(prev => next)`, the updater function MUST be pure:
- **DO NOT** trigger side effects (API calls, toasts, localStorage writes, navigation) inside `setState((prev) => ...)`.
- React 19 may invoke updaters multiple times during speculative or concurrent renders.
- **Correct Pattern**:
  ```typescript
  // Perform side effect outside
  showToast("Record updated");
  // Pure state update
  setRecords(prev => [...prev, newRecord]);
  ```

### 2.2 Effect Lifecycle & Guaranteed Cleanup
Every subscription, timer, or socket MUST provide an explicit teardown return function:
- **WebSockets**:
  ```typescript
  useEffect(() => {
    const socket = new WebSocket(url);
    socket.onmessage = handleMessage;
    return () => {
      socket.close();
    };
  }, [url]);
  ```
- **Timers**: Store timer references in `useRef<NodeJS.Timeout | null>` and clean up on component unmount:
  ```typescript
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  ```

### 2.3 Hydration & Render Purity
- **DO NOT** execute non-deterministic functions (`Date.now()`, `Math.random()`, `crypto.randomUUID()`) during render.
- Precompute timestamps in handlers or derive them stably from server props.
- Hoist reusable formatters (`Intl.DateTimeFormat`, `Intl.NumberFormat`) to module scope rather than recreating them on every render pass.

---

## 3. Security & Secret Isolation

- **Zero Secrets in Client Code**: No API tokens, database connection strings, webhook URLs, or PagerDuty keys may exist in client components or static props.
- **Vault-Managed Backend Proxying**: All third-party services and database queries MUST route through Django REST backend endpoints.
- Client settings tables must display metadata or backend vault references (`Managed via backend vault (Vault: secret/...)`) rather than live credentials.

---

## 4. Role Portal Separation

The application enforces strict isolation between five clinical role portals:
1. `/user` — Patient portal (appointments, vitals, medical records, risk assessments).
2. `/doctor` — Physician workspace (patient charts, diagnostic reviews, AI assistant).
3. `/nurse` — Nursing dashboard (triage, vitals entry, escalations, shift tasks).
4. `/informaticist` — Health data analytics, ML model evaluation, drift monitoring.
5. `/admin` — System configuration, user RBAC, database health, audit logs.

Each portal strictly adheres to:
- Dedicated middleware role enforcement.
- Light-theme aesthetic (`bg-white`, `border-slate-200`, `text-slate-900`).
- No unauthorized cross-portal navigation leaks.
