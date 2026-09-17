# Loop Engineering Governance Configuration (LOOP.md)

This file defines the controlled engineering agent loops operating around the Clinical Decision Support System (CDSS).

## Active Loops

### 1. Daily Repository Health & CI Triage
- **Pattern**: `DAILY_TRIAGE`
- **Cadence**: `DAILY`
- **Autonomy**: `L1_REPORT_ONLY`
- **Tools**: `READ_REPOSITORY`, `READ_GIT`, `RUN_TESTS`, `RUN_LINT`, `RUN_REACT_DOCTOR`
- **Verification**: Maker / Checker Verifier
- **Approval**: Not required for report generation.

### 2. CI Failure Sweeper
- **Pattern**: `CI_SWEEPER`
- **Cadence**: `CI_EVENT`
- **Autonomy**: `L2_ASSISTED`
- **Tools**: `READ_REPOSITORY`, `WRITE_WORKTREE`, `RUN_TESTS`, `RUN_LINT`, `RUN_TYPECHECK`
- **Verification**: Maker / Checker Verifier + Unit Tests
- **Approval**: Dual-custody sign-off required before draft PR creation.

### 3. Spec Kit Convergence Auditor
- **Pattern**: `SPEC_CONVERGENCE`
- **Cadence**: `PR_EVENT`
- **Autonomy**: `L1_REPORT_ONLY`
- **Tools**: `READ_REPOSITORY`, `READ_GIT`
- **Verification**: Cross-artifact spec drift check
- **Approval**: Report only.

## Path Denylist
The following paths are protected from automated writes:
- `.env*`
- `secrets/`
- `credentials/`
- `backend/apps/clinical/`
- `backend/apps/patients/`
- `backend/apps/predictions/`
- `backend/apps/model_registry/`
- `backend/apps/accounts/`
- `backend/apps/audit/`

## Kill Switch
Emergency halt:
```env
ENGINEERING_LOOPS_ENABLED=false
```
