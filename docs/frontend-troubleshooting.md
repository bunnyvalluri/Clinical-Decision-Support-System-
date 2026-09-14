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
