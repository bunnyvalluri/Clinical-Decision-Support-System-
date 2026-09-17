# Loop Patterns Catalog

## Standard Upstream Patterns
- `DAILY_TRIAGE`: Scans CI status, pull requests, open issues, and dependency advisories.
- `CI_SWEEPER`: Catches transient or syntax test errors and prepares isolated fixes in worktrees.
- `DEPENDENCY_SWEEPER`: Audits Python and Node package advisories without auto-merging major upgrades.
- `SPEC_CONVERGENCE`: Audits code against Spec Kit constitutions, specs, and tasks.

## Application-Specific Patterns
- `CLINICAL_CODE_HEALTH`: L1 scan checking clinical route tests and risk scoring regressions.
- `ML_REGRESSION_CHECK`: L1 audit tracking model accuracy, calibration, and SHAP stability.
