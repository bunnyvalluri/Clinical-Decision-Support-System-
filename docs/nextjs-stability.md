# Next.js Stability & Production Hardening Guide

## Overview

This guide details the stability, reliability, and production hardening architecture implemented for the Next.js 16 (React 19, Turbopack) Clinical Decision Support System (CDSS). The system spans five isolated healthcare roles:
1. **Patient / User Portal** (`/user/*`)
2. **Physician / Doctor Portal** (`/doctor/*`)
3. **Nurse Portal** (`/nurse/*`)
4. **Medical Informaticist Portal** (`/informaticist/*`)
5. **IT Administrator Portal** (`/admin/*`)

---

## 1. Core Stability Principles

### 1.1 Zero Compiler & Type Exceptions
- **Zero `@ts-ignore` / `@ts-nocheck`**: Every module, interface, and store adheres strictly to TypeScript interfaces derived from backend Django REST Framework serializers and WebSocket payloads.
- **Zero `any` / `as unknown as`**: All dynamic payloads are validated or narrowed with explicit type guards (`typeof`, `in`, or custom guard functions).
- **Zero Cascading Renders**: Elimination of synchronous `setState` within `useEffect` bodies to satisfy React 19 compiler strictness (`react-hooks/set-state-in-effect`).

### 1.2 Deterministic Role Isolation
- Role validation occurs at three distinct layers:
  1. **Edge Middleware Proxy (`middleware.ts`)**: Evaluates authentication cookies and route prefixes immediately before request processing, generating clean HTTP 307 redirects to the authorized portal.
  2. **Client-Side Guard (`RoleGuard.tsx`)**: Replaces unauthorized requests via `router.replace` without flashing intermediate "Access Denied" or error screens.
  3. **Backend DRF Permissions & Channels RBAC**: Authoritative authorization enforcement across all API endpoints and WebSocket channels.

---

## 2. React 19 & Next.js 16 Compiler Hardening

### 2.1 Purity and State Initialization
- **Problem**: Calling non-pure APIs like `Date.now()` or `new Date()` directly in component render bodies violates React 19 purity rules and triggers hydration mismatches.
- **Solution**: Dynamic IDs and timestamps are isolated to lazy initializers (`React.useState(() => Date.now())`), event callbacks (`handleBook`, `sendMessage`), or server timestamps from the backend.

### 2.2 Synchronous State in Effects
- **Problem**: Invoking state-modifying functions synchronously inside `useEffect` causes infinite loops or double renders.
- **Solution**: Data-fetching routines are executed asynchronously with mounted flags:
```typescript
React.useEffect(() => {
  let isMounted = true;
  const loadData = async () => {
    try {
      const response = await apiClient.get('/api/endpoint/');
      if (isMounted && response.data) {
        setData(response.data);
      }
    } catch (err) {
      if (isMounted) setError(err);
    }
  };
  loadData();
  return () => {
    isMounted = false;
  };
}, []);
```

---

## 3. Production Build Validation Pipeline

The frontend verification pipeline enforces four strict automated stages:
1. **Type Verification**: `npm run type-check` (`tsc --noEmit`) - 100% strict typing compliance.
2. **Lint Conformance**: `npm run lint` (`eslint`) - Zero linting errors.
3. **Role Routing Matrix**: `npm run test:routes` (`node --test tests/roleRoutes.test.mjs`) - 11 automated test assertions across all 5 roles.
4. **Production Compilation**: `npm run build` (`next build` with Turbopack) - 93 static and dynamic routes compiled and verified.

---

## 4. UI/UX Consistency Standards
- **Pure White / Light Mode**: Strict compliance with healthcare clinical environment standards (`bg-white`, `bg-slate-50`, `text-slate-900`, `border-slate-200`).
- **Responsive Architecture**: Mobile-first touch-target sizing (`h-10` minimum for interactive elements, `touch-target` class), responsive sheet modals (`ResponsiveModal`), and role-isolated mobile floating navigation bars.
