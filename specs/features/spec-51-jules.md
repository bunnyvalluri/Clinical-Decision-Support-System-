# Specification: Google Jules API Integration for Engineering Automation (Prompt 51)

## 1. Executive Summary
This specification documents the integration of the Google Jules REST API (`https://jules.googleapis.com/v1alpha`) into HealthNova AI to deliver automated bug fixing, CI failure remediation, code review assistance, and engineering automation.

## 2. Invariants & Governance
- **Authority**: Sole authoritative source of truth is Neon PostgreSQL.
- **Role Isolation**: Only `IT_ADMIN` or `ADMIN` may view or operate Jules endpoints.
- **Theme**: Strict White/Light Theme only (zero `dark:*` Tailwind classes).
- **Safety**: Non-clinical boundary enforced; zero PHI or clinical model changes allowed.
- **Dual Custody**: All high-risk and plan execution tasks require explicit human sign-off.

## 3. Architecture & Data Model
- **Models**:
  - `JulesSource`: GitHub repository connector and synchronization state.
  - `JulesRemediationJob`: End-to-end remediation request with lifecycle state machine.
  - `JulesSession`: Direct Jules v1alpha session mirror with activities and artifacts.
  - `JulesActivity`: Step-by-step progress, thoughts, bash commands, diffs.
  - `JulesArtifact`: Pull requests, diff patches, test outputs.
  - `JulesApproval`: Dual-custody audit log of admin authorization.
  - `JulesAuditEvent`: Immutable system audit ledger.

## 4. Frontend Routes & Components
- `/admin/automation/jules`: Dashboard overview and health card.
- `/admin/automation/jules/sessions`: Interactive session management.
- `/admin/automation/jules/remediations`: Remediation jobs and approval dialogs.
- `/admin/automation/jules/sources`: Connected GitHub repositories.
- `/admin/automation/jules/activity`: Global audit activity feed.
- `/admin/automation/jules/settings`: Operational parameters and circuit breaker status.

## 5. Verification
- Backend unit tests: 17/17 passing.
- Frontend unit tests: 10/10 passing (103/103 total suite passing).
- TypeScript compile: 0 errors.
- Next.js build: verified.
