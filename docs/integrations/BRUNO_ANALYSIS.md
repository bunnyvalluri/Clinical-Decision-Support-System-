# Bruno Integration & Capability Analysis — HealthNova AI CDSS (BPY-CSE-2666)

> **Role**: Git-Native API Development, Contract Testing, Regression Verification, and CI/CD Quality Platform  
> **Source Repository**: https://github.com/usebruno/bruno.git  
> **Pinned Version**: `@usebruno/cli@4.1.0`  
> **Authoritative Healthcare State**: Neon PostgreSQL  
> **Authoritative Business & Auth Logic**: Django / Django REST Framework

---

## 1. Executive Summary & Purpose

Bruno is an open-source, offline-first, Git-native API client and test automation framework. Unlike legacy proprietary API clients that force team workspaces into centralized vendor clouds or store collections in opaque proprietary formats, Bruno stores API collections directly in the filesystem using the human-readable **Bru markup language (`.bru`)**.

In the HealthNova AI Clinical Decision Support System (CDSS), Bruno is integrated strictly as an **API Quality, Contract Testing, and CI/CD Verification Layer**. It does **NOT** act as a database, authentication provider, API gateway, patient portal, or production secret store.

```
                    DEVELOPERS & CI/CD RUNNERS
                               |
                               v
                     BRUNO COLLECTIONS
                     (Git-Native .bru)
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
          Contract        5-Role RBAC       Security &
          Testing         & IDOR Tests     Sanitization
              |                |                |
              +----------------+----------------+
                               |
                      Safe Mode CLI (4.1.0)
                               |
                               v
                    DJANGO REST FRAMEWORK
                 (Authentication & AuthZ Gate)
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
    NEON POSTGRESQL          REDIS                  CELERY
(Authoritative Store)     (Cache/PubSub)      (Async Inference)
```

---

## 2. Bruno Architecture & Component Mapping

| Bruno Component | Architecture Role in HealthNova AI | Utilization in CDSS |
| :--- | :--- | :--- |
| **Bru Markup (`.bru`)** | Plain-text request & test specifications | Used for 100% of collection definitions; version-controlled in Git. |
| **Bruno CLI (`bru run`)** | Headless automated test runner | Used in CI/CD pipeline and pre-commit checks for regression gates. |
| **Environments (`.bru`)** | Scoped runtime variables | Templates for `Local`, `Development`, `Test`, `Staging`, `Production`. |
| **Safe Mode Sandboxing** | Isolated JavaScript execution sandbox | **Enforced by default** (`--sandbox=safe`). Blocks arbitrary filesystem and process access. |
| **Developer Mode Sandboxing** | Unrestricted Node.js execution | **Disabled**. Never enabled globally; requires explicit approval for trusted tasks. |
| **Bruno Desktop IDE** | Electron developer UI | Used locally by engineers. **Never embedded** into Next.js or role portals. |
| **Secret Storage** | In-memory runtime variables | Sensitive secrets (`*.secret.bru`) gitignored; injected via CI environment variables. |

---

## 3. Features Used vs. Features Deliberately Omitted

### Features Utilized
1. **Plaintext Git-Tracked Collections**: All endpoints, assertions, and test scripts reside in the `bruno/` directory alongside source code.
2. **Deterministic Declarative Assertions**: Schema and status assertions (`res.status`, `res.body`, field types) validating strict DRF response contracts.
3. **5-Role RBAC & IDOR Verification**: Dedicated test suites ensuring Doctor, Nurse, Informaticist, IT Admin, and Patient permissions are mathematically enforced.
4. **Dynamic Token Acquisition**: Pre-request and post-response scripts to exchange test credentials for short-lived JWT tokens without hardcoding secrets.
5. **JUnit & JSON CI Reporting**: Automated generation of `junit.xml` test reports ingested by CI/CD gates.
6. **Degraded Mode Verification**: Tests asserting graceful PostgreSQL fallback when Meilisearch or Redis is offline.

### Features Deliberately Omitted
1. **Desktop App Embedding**: No Electron or webview packaging into the Next.js frontend or doctor/nurse/patient portals.
2. **Cloud Sync / Proprietary Cloud Accounts**: Bruno's offline-first Git model is used exclusively; no external cloud synchronizers.
3. **Unrestricted Internet Scanning / Fuzzing**: Bruno is restricted to localhost, test environments, and authorized internal gateways.
4. **Production Destructive Tests**: `DELETE`, destructive `POST`, or database truncations are barred from production collections.
5. **Real Patient PHI**: Zero real patient identifiers, names, phone numbers, or clinical notes are committed.

---

## 4. Security & Healthcare Invariants

1. **Neon PostgreSQL Remains Authoritative**: Bruno never writes directly to databases or caches. All operations transit DRF REST endpoints.
2. **Safe Mode Default**: Bruno CLI 3.x+ default Safe Mode is strictly maintained. Scripts cannot execute arbitrary shell commands or inspect the host filesystem.
3. **Query & Data Sanitization**: Bruno tests verify that DRF serializes responses without leaking password hashes, MFA keys, or internal tokens.
4. **Exact Identifier Protections**: Verifies that medical record numbers (`mrn`), model versions, and prediction UUIDs are treated with exact matching and zero typos.
5. **Audit Invariant**: Tests confirm that sensitive clinical updates generate immutable `AuditLog` and `SearchAuditEvent` records.
