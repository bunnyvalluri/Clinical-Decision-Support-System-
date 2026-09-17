# Firecrawl Web Intelligence & Controlled Web Retrieval

## Overview
Firecrawl (`v1.10.2`) provides controlled web intelligence, single-page scraping, asynchronous site crawling, URL mapping, batch scraping, and structured JSON extraction for the Clinical Decision Support System (CDSS).

It acts strictly as an **evidence retrieval and literature discovery tool** behind the application's AI Gateway and Web Gateway. It does **not** serve as a clinical database, prescription authority, or diagnostic engine.

---

## Core Capabilities

| Capability | DRF Endpoint | Background Mechanism | Supported Roles |
| :--- | :--- | :--- | :--- |
| **Web Search** | `POST /api/v1/web/search/` | Synchronous / Short Cache | Doctor, Nurse, Informaticist, Admin, Patient (constrained) |
| **Page Scrape** | `POST /api/v1/web/scrape/` | Synchronous / Circuit Breaker | Doctor, Informaticist, Admin |
| **Site Map** | `POST /api/v1/web/map/` | Synchronous / Filtered | Doctor, Informaticist, Admin |
| **Async Crawl** | `POST /api/v1/web/crawl/` | Celery Worker + Redis | Informaticist, Admin |
| **Batch Scrape** | `POST /api/v1/web/batch/` | Celery Worker + Redis | Informaticist, Admin |
| **Structured Extract** | `POST /api/v1/web/extract/` | Celery / Pydantic Schema | Doctor, Informaticist, Admin |
| **Evidence Research** | `POST /api/v1/web/research/` | Multi-step Swarm + LLM | Doctor, Informaticist |
| **Jobs Manager** | `GET /api/v1/web/jobs/` | PostgreSQL Query | All authenticated (scoped by ownership/role) |
| **Admin Health** | `GET /api/v1/web/admin/health/` | Live Telemetry & Probes | IT Admin |

---

## Strict Healthcare Invariants

1. **Neon PostgreSQL is the sole authoritative source of truth**: All jobs, documents, content hashes, and research findings are stored in Neon PostgreSQL. Firecrawl internal storage is purely operational.
2. **Zero PHI Outbound**: Context builders strip all patient identifiers before initiating external web queries.
3. **Non-Diagnostic Invariant**: Web evidence is never converted into autonomous clinical actions. Mandatory attending clinician sign-off is required.
4. **Strict White-Only UI**: All web intelligence user interfaces adhere strictly to the clean white/slate design system with zero dark mode tokens.
5. **SSRF and Prompt Injection Defense**: Every external URL is validated against private network boundaries, and all scraped content is quarantined as untrusted data.
