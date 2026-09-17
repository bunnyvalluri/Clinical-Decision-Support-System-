# Firecrawl Web Intelligence Architecture

## 1. System Topology & Request Flow

```
[ CLINICAL USER / INFORMATICIST / ADMIN ]
                    |
                    v (HTTPS / Session / JWT)
         [ NEXT.JS FRONTEND (White-Only) ]
                    |
                    v (REST /api/v1/web/)
        [ DJANGO REST FRAMEWORK CONTROLLER ]
                    |
                    +--> [ SECURITY & POLICY GATEWAY ]
                    |         - SSRF & IP Validation (RFC1918 / Loopback)
                    |         - Domain Allowlist / Blocklist
                    |         - Data Classification (Zero PHI)
                    |         - Rate Limiting & Quotas
                    |
                    v
         [ WEB INTELLIGENCE SERVICE ]
                    |
                    +--> [ PROVIDER ABSTRACTION LAYER ]
                    |         |
                    |         +--> FirecrawlProvider (v1.10.2)
                    |         +--> ApprovedApiProvider (Fallback)
                    |         +--> MockProvider (Test Fixtures Only)
                    |
                    +--> [ ASYNC JOBS VIA CELERY & REDIS ]
                    |         - Async Site Crawling
                    |         - Bounded Batch Scraping
                    |         - Structured Extraction
                    |
                    +--> [ DATA NORMALIZATION & PROVENANCE ]
                    |         - HTML & Script Sanitization
                    |         - SHA-256 Content Hashing
                    |         - Citation Verification
                    |
                    +--> [ PERSISTENCE & BROADCAST ]
                              |
                              +--> Neon PostgreSQL (Authoritative Storage)
                              +--> Meilisearch (RAG Semantic Indexing)
                              +--> Django Channels (WebSocket ws/web/ Events)
```

---

## 2. Job Lifecycle State Machine

Asynchronous web intelligence operations (Crawls, Batch Scrapes, Large Extractions) follow a deterministic state machine persisted authoritatively in Neon PostgreSQL:

```
  [ QUEUED ]
      |
      v
  [ RUNNING ] ---- (Cancellation Request) ----> [ CANCELLED ]
      |
      +----------> [ COMPLETED ] (All target pages scraped & validated)
      |
      +----------> [ PARTIAL ] (Some pages succeeded, errors < threshold)
      |
      +----------> [ FAILED ] (Fatal error, domain blocked, unrecoverable)
      |
      +----------> [ TIMEOUT ] (Exceeded max_crawl_duration_seconds)
```

State changes trigger transactional post-commit Django Channels events (`web.job.created`, `web.job.started`, `web.job.progress`, `web.job.completed`, `web.job.failed`, `web.job.cancelled`) pushed to client WebSockets.

---

## 3. Provider Abstraction & Clean Room Design

To completely decouple business logic from Firecrawl and prevent vendor lock-in or licensing entanglement:
1. `WebRetrievalProvider` defines standard asynchronous and synchronous interfaces for `search()`, `scrape()`, `map()`, `crawl()`, `batch_scrape()`, and `extract()`.
2. `FirecrawlProvider` translates domain requests into HTTP calls against Firecrawl `v1.10.2` REST API.
3. `FirecrawlClient` implements a Circuit Breaker pattern (`CLOSED`, `OPEN`, `HALF_OPEN`) with exponential backoff and jitter for transient 5xx server errors, ensuring upstream Firecrawl outages never degrade core clinical workflows.
