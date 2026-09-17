# Firecrawl RAG & Knowledge Ingestion Pipeline

## 1. Pipeline Overview

```
[ WEB SEARCH / SCRAPE ]
           |
           v
[ CONTENT NORMALIZATION ]
     - Markdown extraction & whitespace cleanup
     - HTML tag & script sanitization
     - Cryptographic SHA-256 content hashing
           |
           v
[ CHUNKING & METADATA ENRICHMENT ]
     - Recursive character splitting (chunk_size: 512, overlap: 64)
     - Metadata: source_url, source_title, domain, retrieved_at, trust_tier
           |
           v
[ EMBEDDING & INDEXING ]
     - Text embedding generation
     - Ingestion into Meilisearch `clinical_guidelines` & `web_intelligence` index
           |
           v
[ RETRIEVAL & GROUNDING ]
     - Hybrid keyword + semantic vector retrieval
     - Strict authorization filtering by user role
     - Citation grounding and provenance linking
           |
           v
[ OLLAMA / LOCAL LLM INFERENCE ]
     - Untrusted content quarantine tags
     - Synthesis with explicit uncertainty and conflict detection
```

---

## 2. Source Provenance & Verification
Every document chunk fed into RAG retains an immutable reference to:
- `document_id`: UUID primary key in Neon PostgreSQL.
- `source_url`: Full canonical URL of the external page.
- `content_hash`: SHA-256 checksum of raw scraped content.
- `retrieved_at`: ISO-8601 UTC timestamp of retrieval.
- `trust_tier`: Assigned tier (`TIER_1` to `TIER_4`).
