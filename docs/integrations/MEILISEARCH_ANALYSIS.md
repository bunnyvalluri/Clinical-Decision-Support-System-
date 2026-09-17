# Meilisearch Integration Technical Analysis

**Project:** BPY-CSE-2666 — HealthNova AI Clinical Decision Support System  
**Document:** Meilisearch Architectural Evaluation & Integration Design  
**Selected Production Version:** `v1.12.0` (Docker: `getmeili/meilisearch:v1.12.0`, Python SDK: `meilisearch==0.43.0`)  
**License:** MIT License  
**Date:** 2026-09-17  

---

## 1. Executive Summary

This document provides the foundational engineering analysis for integrating **Meilisearch v1.12.0** as an auxiliary, high-performance search projection engine within the HealthNova AI Clinical Decision Support System. 

### Core Architectural Principle
```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║ 1. Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.                        ║
║ 2. Django is the AUTHORITATIVE BUSINESS LOGIC & AUTHORIZATION GATEKEEPER.            ║
║ 3. Meilisearch is an EVENTUALLY CONSISTENT SEARCH PROJECTION INDEX.                  ║
║ 4. ZERO patient PHI or confidential secrets are stored in raw or unmasked indexes.   ║
║ 5. If Meilisearch is unavailable, Django falls back to safe PostgreSQL search.       ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

Meilisearch is **NOT** a primary database, clinical transaction store, patient record database, model registry, or audit authority. It serves strictly as a **read-optimized search projection cache** delivering sub-50ms typo-tolerant filtering, sorting, and faceted exploration.

---

## 2. Upstream Repository & Architecture Review

* **Upstream Repository:** `https://github.com/meilisearch/meilisearch.git`
* **Language & Core Engine:** Rust
* **Storage Engine:** Lightning Memory-Mapped Database (LMDB) — embedded, transactional B-tree key-value storage engine providing ACID transactions and memory-mapped virtual memory efficiency.
* **Concurrency Model:** Multi-threaded read operations leveraging OS page caching; single-threaded write queue ensuring transactional serialization through an asynchronous task framework.
* **HTTP API Protocol:** RESTful JSON over HTTP/1.1; asynchronous task responses with task UID monitoring.

### 2.1 Pinned Production Version: `v1.12.0`
Version `v1.12.0` was selected after reviewing releases v1.11 through v1.13 for the following reasons:
1. **Index Performance & Stability:** Includes performance optimizations yielding 2x faster document insertion and 4x faster incremental updates.
2. **Batches API:** Introduces batch UID telemetry on tasks, allowing batch monitoring of asynchronous projection jobs.
3. **Selective Typo Tolerance & Numeric Restrictions:** Allows disabling typo tolerance on numeric identifiers and specific attribute fields, which is mandatory for Medical Record Numbers (MRNs) and UUIDs.
4. **Tenant Tokens (HMAC-SHA256):** Mature token signing enabling client-side search scoping when necessary, without exposing the server's master key.
5. **Dumpless Upgrades & Snapshot Reliability:** Proven snapshot and recovery primitives.

---

## 3. Features Used vs Features Intentionally Not Used

| Feature | Status | Architectural Rationale |
| :--- | :--- | :--- |
| **Document Indexing** | **USED** | Projections of authorized clinical records, patients, models, and tasks. |
| **Search & Highlight** | **USED** | Fast clinician search with safely-escaped snippets (no raw HTML injection). |
| **Faceted Filtering** | **USED** | Faceting by risk category, encounter status, triage state, and model status. |
| **Controlled Typo Tolerance** | **USED** | Enabled for clinician notes and names; **disabled** for MRNs and identifiers. |
| **Async Task Queue** | **USED** | Celery monitors Meilisearch task completion for idempotent projections. |
| **Snapshots & Dumps** | **USED** | Operational disaster recovery and search index rebuilding. |
| **Tenant Tokens** | **USED** | Scoped client search for approved public knowledge datasets. |
| **Direct Browser Indexing** | **NEVER** | All writes strictly mediated by Django and Celery. |
| **Master Key in Frontend** | **FORBIDDEN** | Master key restricted exclusively to server-side Celery & Django. |
| **Autonomous AI Index Deletion**| **FORBIDDEN** | AI agents (Ruflo/MCP) are restricted to read-only search tools. |
| **Unrestricted Vector PHI** | **FORBIDDEN** | Vector/hybrid search restricted to approved medical literature. |

---

## 4. Deployment Model

1. **Docker Container:** `getmeili/meilisearch:v1.12.0` running alongside backend services.
2. **Network Isolation:** Meilisearch binds only to the internal container network (`healthnova-network`). External public access is denied; only Django and Celery communicate directly with port 7700.
3. **Storage Persistence:** Mounted volume `meilisearch_data:/meili_data` stores LMDB files.
4. **Reconstructability:** If the Meilisearch container or volume is destroyed, an asynchronous Celery task reconstructs all indexes directly from authoritative Neon PostgreSQL data.

---

## 5. Security & Privacy Implications

1. **PHI Minimization:** Documents stored in Meilisearch contain only minimum-necessary identifiers (e.g., pseudonymized `display_identifier`, `mrn`, risk category, assigned doctor ID). Full raw medical records remain in PostgreSQL.
2. **Secrets Exclusion:** Passwords, API tokens, SMS payloads, and session credentials are systematically stripped by `SearchProjectionService`.
3. **Filter Injection Protection:** Search queries do not concatenate raw strings into Meilisearch filter expressions. A structured filter builder validates field names against an approved index registry schema.
4. **Auditability:** Every search operation is logged in `SearchAuditEvent` with correlation ID, requesting user ID, role, and sanitized/hashed query strings to prevent PHI retention in search logs.
