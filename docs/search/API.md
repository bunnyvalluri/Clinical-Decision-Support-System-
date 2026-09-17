# Search REST API Reference

**Base URL:** `/api/v1/search/`  
**Authentication:** Bearer JWT (`Authorization: Bearer <access_token>`)  

---

## Endpoints

### 1. Execute Search
`GET /api/v1/search/`

Executes a validated, role-bounded search across authorized indexes.

**Query Parameters:**
- `q` (string, optional): Search query term (max 200 chars).
- `index` (string, optional): Target index UID (e.g. `patients`, `predictions`, `models`). Defaults to all authorized indexes.
- `filters` (string, optional): JSON-encoded structured filters dictionary.
- `sort` (string, optional): Sort expression (e.g. `updated_at:desc`, `created_at:asc`).
- `page` (integer, default 1): Page number.
- `limit` (integer, default 20, max 100): Results per page.
- `highlight` (boolean, default true): Return highlighted snippets.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hits": [
      {
        "document_id": "patient_102",
        "entity_type": "patient",
        "title": "Jane Doe",
        "subtitle": "MRN-90241 • Cardiology",
        "risk_level": "HIGH",
        "status": "ACTIVE",
        "updated_at": 1758110400,
        "score": 0.98,
        "highlight": "<em>Jane</em> Doe"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "total_pages": 1,
    "processing_time_ms": 14,
    "search_mode": "meilisearch"
  }
}
```

### 2. Autocomplete Suggestions
`GET /api/v1/search/suggestions/?q=<term>&index=<index_uid>`

Returns non-sensitive suggestion pills for clinical query formulation.

### 3. Search Facets
`GET /api/v1/search/facets/?index=<index_uid>`

Returns facet distributions for filtering (e.g. `risk_level`, `status`, `algorithm`).

### 4. Search Health & Cluster Status
`GET /api/v1/search/health/`

Returns Meilisearch node health, version, database size, index statistics, and task latency.

### 5. Reindex Trigger (Admin / Informaticist Only)
`POST /api/v1/search/reindex/`

Triggers background reindexing of an index via Celery. Body: `{"index": "patients"}`.

### 6. Search Tasks Monitor
`GET /api/v1/search/tasks/`

Returns active, pending, and completed Meilisearch task statuses for IT Admin visibility.
