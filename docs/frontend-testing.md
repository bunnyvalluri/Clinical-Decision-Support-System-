# Frontend Testing & Verification Guide

## Overview

The CDSS frontend incorporates rigorous testing to ensure zero runtime regressions, correct route authorization, and strict typing compliance across all clinical portals.

---

## 1. Test Suite Commands

Run the following commands inside `frontend/`:

### 1.1 Role Route Matrix Unit Tests
```bash
npm run test:routes
```
- **Execution Engine**: Node.js built-in test runner (`node --test tests/roleRoutes.test.mjs`).
- **Coverage**:
  - Tests valid and cross-role unauthorized access for all 5 roles (`DOCTOR`, `NURSE`, `PATIENT`, `MEDICAL_INFORMATICIST`, `IT_ADMIN`).
  - Asserts that unauthorized role access cleanly redirects to the respective role dashboard without routing to forbidden pages.
  - Asserts that unauthenticated access redirects to `/login`.

### 1.2 Strict Type Verification
```bash
npm run type-check
```
- **Execution Engine**: `tsc --noEmit`.
- **Standards**: Zero errors permitted. Validates all interfaces, store contracts, and React 19 component props.

### 1.3 Static Analysis & Code Quality
```bash
npm run lint
```
- **Execution Engine**: ESLint.
- **Standards**: Zero errors permitted. Validates Next.js rules, hooks rules, and unused variable policies.

### 1.4 Production Build Verification
```bash
npm run build
```
- **Execution Engine**: Next.js 16 compiler with Turbopack.
- **Coverage**: Verifies compilation, prerendering, and static page generation for all 93 routes.

---

## 2. CI/CD Integration

In the automated deployment pipeline:
1. `npm run type-check` runs on every pull request.
2. `npm run test:routes` executes unit assertions.
3. `npm run lint` ensures stylistic and architectural consistency.
4. `npm run build` certifies deployment readiness before Docker container creation or Vercel edge deployment.
