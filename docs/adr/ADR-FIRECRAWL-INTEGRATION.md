# ADR-FIRECRAWL-INTEGRATION: Controlled Web Intelligence and Retrieval Infrastructure

- **Status**: APPROVED
- **Date**: 2026-09-17
- **Authors**: Principal Software Architect, Senior Security Engineer, Senior Clinical AI Safety Engineer
- **Context**: BPY-CSE-2666 Clinical Decision Support System (CDSS)

---

## 1. Context and Problem Statement

The Clinical Decision Support System (CDSS) requires up-to-date medical literature discovery, clinical guideline retrieval, verified research synthesis, and public evidence verification to augment AI recommendations and clinician workflows. Previously, medical guidelines were retrieved solely through pre-loaded static documents in Meilisearch or curated public APIs. Clinicians and informaticists require an approved, safe method to retrieve external web intelligence without compromising patient privacy (PHI), without introducing SSRF or prompt injection vulnerabilities, and without bypassing attending clinician oversight.

---

## 2. Decision Drivers

1. **Healthcare Data Invariants**: Neon PostgreSQL must remain the authoritative source of truth. Zero patient PHI must be exported to web scrapers or external indices.
2. **Clinical Safety**: Web retrieval is NOT clinical truth. Retrieved content must never trigger automated diagnoses, prescriptions, or patient risk overrides.
3. **Security Posture**: Untrusted external web content must be sanitized against malicious scripts, SSRF (private IP subnets, link-local, cloud metadata), and prompt injection hijacks.
4. **License Integrity**: Firecrawl core is AGPL-3.0; the integration must maintain a strict Clean Room service boundary across HTTP REST APIs with zero source code contamination.
5. **Architectural Cohesion**: Web intelligence must seamlessly feed the existing RAG pipeline, Meilisearch index, Celery task queue, and Django Channels real-time event layer.
6. **Dual Deployment Modes**: Support both Mode A (Managed Firecrawl API) and Mode B (Self-Hosted containerized Firecrawl via Coolify).

---

## 3. Considered Options

- **Option 1: Direct In-Process Web Scraping (Scrapy/Selenium in Django)**
  - *Cons*: Heavy resource footprint, complex headless browser maintenance, poor anti-bot handling, tight coupling, and high maintenance burden.
- **Option 2: Direct Frontend Web Retrieval (Next.js fetching external URLs)**
  - *Cons*: Severe security vulnerability, CORS issues, direct exposure of API keys, inability to enforce centralized RBAC, SSRF defenses, or audit trails.
- **Option 3: Firecrawl via Clean Room Service Architecture (CHOSEN)**
  - *Pros*: Pinned release `v1.10.2`, robust markdown normalization, single-page scrape, multi-page crawling, site mapping, structured extraction, strict service abstraction (`WebRetrievalProvider`), and clean isolation.

---

## 4. Decision & Architectural Invariants

We adopt **Firecrawl `v1.10.2`** integrated via a controlled service boundary:

1. **Abstract Provider Layer**: The application communicates via `WebRetrievalProvider` interface implemented by `FirecrawlProvider`, with fallbacks to `ApprovedApiProvider` and mock testing providers.
2. **SSRF & Security Defense**: A multi-tiered security gateway validates all URLs, resolves hostnames to verify against RFC1918/link-local/loopback addresses, validates redirect chains, strips malicious script tags from HTML, and wraps web output in `<untrusted_web_content>` prompt injection quarantine markers.
3. **Authoritative Neon Storage**: Job states (`QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELLED`, `TIMEOUT`), document provenance, SHA-256 content hashes, and research sessions are persisted authoritatively in Neon PostgreSQL.
4. **Real-time Event Streaming**: Django Channels broadcasts post-commit job progress and research updates to authorized frontend clients over WebSockets (`ws/web/`).
5. **Strict White-Only Frontend**: All research UI pages (`/doctor/research`, `/nurse/research`, `/informaticist/research`, `/admin/web-intelligence`, `/user/education`) adhere strictly to the constitutional white-only design standard.

---

## 5. Consequences

### Positive
- High-quality, clean markdown extraction of medical guidelines and clinical studies.
- Full traceability with cryptographic content hashes (SHA-256) and source URLs.
- Robust defense-in-depth preventing SSRF, prompt injection, and credential exfiltration.
- Zero license contamination of proprietary clinical algorithms.

### Negative / Mitigation
- External dependency on Firecrawl service: Mitigated by circuit breaker (CLOSED/OPEN/HALF-OPEN), exponential backoff retries, and graceful degradation returning honest unavailable states rather than breaking clinical core.
