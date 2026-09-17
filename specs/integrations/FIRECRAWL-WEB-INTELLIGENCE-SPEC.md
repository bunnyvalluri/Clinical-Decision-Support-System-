# SPEC-INTEG-043: Firecrawl Web Intelligence & Retrieval Infrastructure

## 1. Requirement & Scope
- **ID**: `SPEC-INTEG-043`
- **Module**: `backend/integrations/firecrawl/` & `backend/apps/web_intelligence/`
- **Component**: Controlled Web Intelligence, Crawling, Scraping & RAG Retrieval
- **Authoritative Store**: Neon PostgreSQL
- **License Boundary**: AGPL-3.0 Clean Room Isolation

---

## 2. Functional Requirements

- **REQ-FC-001**: Provider abstraction layer (`WebRetrievalProvider`) supporting Firecrawl API `v1.10.2` with failover to approved medical APIs.
- **REQ-FC-002**: Asynchronous crawl jobs backed by Celery and Redis with PostgreSQL-persisted state machine (`QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELLED`, `TIMEOUT`).
- **REQ-FC-003**: Real-time progress and completion streaming via Django Channels WebSockets (`ws/web/`).
- **REQ-FC-004**: Multi-tier enterprise SSRF protection rejecting RFC1918, loopback, link-local, cloud metadata, and DNS rebinding attacks.
- **REQ-FC-005**: Strict prompt injection quarantine tagging external web text within `<untrusted_web_content>`.
- **REQ-FC-006**: Source provenance and cryptographic SHA-256 content hashing for all normalized documents.
- **REQ-FC-007**: Role-authorized views for Doctor (`/doctor/research`), Nurse (`/nurse/research`), Informaticist (`/informaticist/research`), Admin (`/admin/web-intelligence`), and Patient (`/user/education`).
- **REQ-FC-008**: Strict White-Only design system enforcement with zero dark-mode tokens.
- **REQ-FC-009**: Clinical non-diagnostic invariant: web content is research evidence only; zero autonomous diagnosis or prescription.
