/**
 * React Doctor Configuration
 * https://github.com/millionco/react-doctor
 *
 * Healthcare CDSS Application Configuration:
 * - Strict light theme enforcement
 * - No telemetry / local-first security policy
 * - Architectural consistency across 5 role portals
 */

export default {
  // Disable external telemetry and cloud score sharing for healthcare privacy compliance
  telemetry: false,

  // Projects or directories to scan
  projects: ["."],

  // Ignore generated build output
  ignorePatterns: [
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "**/*.d.ts",
  ],

  // Severity configuration for rules
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
