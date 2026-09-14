# Frontend Troubleshooting & Production Runbook

## Common Issues & Diagnoses

### 1. Route Redirect Loops or Unauthorized Navigation
- **Symptom**: User is constantly bounced back to their role dashboard or `/login`.
- **Cause**: Cookie `user_role` or token does not match the active session role, or the path is missing from `ROLE_ROUTE_REGISTRY` in `src/lib/roleRoutes.ts`.
- **Resolution**:
  1. Inspect the cookie in browser DevTools (`document.cookie` contains `user_role`).
  2. Verify that the requested path is included in `ROLE_ROUTE_REGISTRY` or covered by prefix rules in `src/lib/roleRoutes.ts`.
  3. Run `npm run test:routes` to verify route evaluation logic.

---

### 2. React 19 Hydration Warnings or Compiler Violations
- **Symptom**: `Warning: Text content did not match. Server: ... Client: ...` or React Hook compiler error `react-hooks/set-state-in-effect`.
- **Cause**: Calling `Date.now()` during render or synchronously setting state inside `useEffect`.
- **Resolution**:
  - Never generate IDs or timestamps directly in JSX or top-level component scope.
  - Move state updates inside asynchronous promises or lazy initializers.

---

### 3. Missing or Stale Data in Clinical Store
- **Symptom**: Patient list or predictions appear empty after page refresh.
- **Cause**: Backend API is offline or unreachable and network error wasn't handled gracefully.
- **Resolution**:
  - Check browser console network tab for failed requests to `NEXT_PUBLIC_API_URL`.
  - The store provides built-in fallback data (`INITIAL_PATIENTS`, `INITIAL_PREDICTIONS`) which are retained during backend timeouts.

---

### 4. Build or Type Check Failures
- **Symptom**: `npm run build` or `npm run type-check` fails with type errors.
- **Resolution**:
  - Run `npm run type-check` to isolate the exact line and file.
  - Ensure that interfaces match the latest backend DRF serializers.
  - Do not use `@ts-ignore` or `any` to mask errors.

---

### 5. React Doctor Quality Audit Violations

#### `artifact-secret-leak` / `no-secrets-in-client-code`
- **Symptom**: React Doctor fails with `✖ Secret shipped in browser artifact` or flags client secrets.
- **Cause**: Hardcoded webhook URLs, API keys, or raw connection strings (e.g., `postgres://`, `https://hooks.slack.com/`) inside client components or `.next/static/chunks/`.
- **Resolution**:
  1. Remove hardcoded strings from component state and defaults.
  2. Use backend vault references or runtime environment variables (`process.env.NEXT_PUBLIC_*`).
  3. Rebuild with `npm run build` to clear stale static chunks before re-auditing.

#### `effect-needs-cleanup`
- **Symptom**: React Doctor flags missing cleanup in custom hook or page effect.
- **Cause**: WebSockets, EventListeners, or intervals instantiated inside `useEffect` without returning a teardown function.
- **Resolution**:
  - Ensure all `new WebSocket()`, `setInterval()`, and `addEventListener()` calls return an explicit cleanup closure:
    ```typescript
    useEffect(() => {
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, []);
    ```

#### `no-impure-state-updater` / `no-side-effect-in-state-updater-function`
- **Symptom**: Flagged side effect inside functional state updater.
- **Cause**: Invoking `showToast()`, `router.push()`, or mutating refs/storage inside `setState((prev) => ...)`.
- **Resolution**: Move all side effects outside the updater function; keep the updater strictly deterministic.

#### `rerender-state-only-in-handlers`
- **Symptom**: State declared with `useState` is modified in event handlers but never read in the JSX output.
- **Cause**: Unnecessary state variables causing redundant component re-renders.
- **Resolution**: Connect the state to UI elements (e.g. `<Button disabled={saved}>`) or replace with a `useRef` if the value is only needed for imperatively tracking state across handlers.

