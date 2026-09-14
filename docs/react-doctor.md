# React Doctor Integration Guide

## Overview

[millionco/react-doctor](https://github.com/millionco/react-doctor) is a Next.js and React codebase auditing and engineering-quality validation tool. It provides automated static analysis tailored specifically for React 19 compiler patterns, state updater hygiene, hydration safety, client bundle secret detection, and accessibility standards.

In the Clinical Decision Support System (CDSS), React Doctor operates as a **development and CI quality gate**. It ensures that features developed across all five role portals (`/user`, `/doctor`, `/nurse`, `/informaticist`, `/admin`) maintain hospital-grade engineering standards.

---

## 1. Healthcare Privacy & Local-First Policy

To comply with HIPAA security safeguards and clinical data privacy standards:
- **Strictly No Telemetry**: All React Doctor invocations are executed with the `--no-telemetry` flag (enforced via CLI scripts and `doctor.config.ts`).
- **No Cloud Score Sharing**: Diagnostic output, file paths, and code metadata are never transmitted to external cloud endpoints.
- **Local AST Analysis**: Audits run entirely within the developer's local machine or GitHub Actions container.

---

## 2. CLI Command Reference

The following npm scripts are configured in `frontend/package.json`:

| Command | Purpose | When to Use |
| :--- | :--- | :--- |
| `npm run doctor` | Run full codebase audit with `--no-telemetry`. | Pre-commit validation and milestone audits. |
| `npm run doctor:verbose` | Run audit with detailed file-by-file diagnostic traces. | In-depth troubleshooting of complex warnings. |
| `npm run doctor:changed` | Audit only files modified in git working directory (`--scope changed`). | Everyday feature branch development. |
| `npm run doctor:design` | Analyze design token usage, typography, and styling consistency. | UI design system audits. |
| `npm run doctor:ci` | Non-blocking advisory check on changed files (`--scope changed --blocking none`). | CI pipeline and PR validation. |

---

## 3. Configuration File (`doctor.config.ts`)

Located at [frontend/doctor.config.ts](file:///c:/4-1/frontend/doctor.config.ts), this file controls rule severities, ignore patterns, and security constraints:

```typescript
export default {
  // Enforce zero external telemetry for healthcare compliance
  telemetry: false,

  // Root directory to scan
  projects: ["."],

  // Ignore build artifacts and declarations
  ignorePatterns: [
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "**/*.d.ts",
  ],

  // Rule severity thresholds
  rules: {
    // P0 Security Rules
    "react-doctor/artifact-secret-leak": "error",
    "react-doctor/no-secrets-in-client-code": "error",
    "react-doctor/auth-token-in-web-storage": "warn",

    // P1 Runtime Correctness & State/Effect Lifecycles
    "react-doctor/effect-needs-cleanup": "error",
    "react-doctor/no-impure-state-updater": "error",
    "react-doctor/no-side-effect-in-state-updater-function": "warn",
    "react-doctor/no-nested-component-definition": "error",
    "react-doctor/no-unstable-nested-components": "error",

    // P2 Accessibility & Performance
    "react-doctor/prefer-html-dialog": "warn",
    "react-doctor/no-redundant-roles": "warn",
    "react-doctor/js-hoist-intl": "warn",
    "react-doctor/rerender-state-only-in-handlers": "warn",
  },
};
```

---

## 4. CI/CD Integration Architecture

Continuous validation is implemented across two touchpoints:

### 1. Main CI Pipeline (`ci-pipeline.yml`)
Located in [ci-pipeline.yml](file:///c:/4-1/ci-pipeline.yml), React Doctor runs during the `frontend-lint` stage alongside ESLint and TypeScript checks:
```yaml
      - name: Run React Doctor (Advisory Gate)
        run: npm run doctor:ci
```

### 2. Dedicated PR Workflow (`.github/workflows/react-doctor.yml`)
Located in [.github/workflows/react-doctor.yml](file:///c:/4-1/.github/workflows/react-doctor.yml), this workflow triggers automatically on pull requests touching `frontend/**`.

### Phased Rollout Strategy:
- **Phase 1 (Current - Advisory Gate)**: Runs with `--blocking none --scope changed`. Prevents blocking PRs while reporting quality feedback on modified files.
- **Phase 2 (Blocking on Errors)**: Elevates P0 security and state lifecycle rules to block PR merges if new violations are introduced.
- **Phase 3 (Zero Warnings Baseline)**: Gradually reduces warning counts across legacy portals until full strict blocking can be enforced.
