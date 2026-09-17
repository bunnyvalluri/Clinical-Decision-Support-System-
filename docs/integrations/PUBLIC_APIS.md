# Public APIs Catalog Integration & Synchronization Guide

> **Clinical Decision Support System — BPY-CSE-2666**  
> **Source Directory:** `https://github.com/public-apis/public-apis.git`

---

## 1. Catalog Overview & Role
The `public-apis` repository is a community-curated catalog of public REST APIs categorized by domain, authentication requirements, HTTPS capability, and CORS support. 

In this healthcare application:
- The catalog is used solely as a **controlled discovery source** for identifying supplementary medical, scientific, and governmental reference datasets.
- The repository is **NOT** a clinical API backend or certification authority.
- No API is automatically integrated or activated simply because it appears in the catalog.

---

## 2. Catalog Synchronization Workflow
```
public-apis repository
        │
        ▼ (Scheduled Celery Worker / Manual Trigger)
  Fetch Catalog Data
        │
        ▼
  Parse Categories & Metadata (Health, Government, Science, Food)
        │
        ▼
  Compare with Neon PostgreSQL ExternalAPIRegistry
        │
        ├─► If New Candidate: Create Entry in "DISCOVERED" status
        │
        ├─► If Changed URL / Auth / HTTPS: Flag "REVIEW_REQUIRED"
        │
        └─► If Deprecated / Removed: Transition to "DEPRECATED"
```

---

## 3. Approved Healthcare Provider Reference

| Provider | Base URL | Category | Auth | Data Classification | Approved Purpose |
|---|---|---|---|---|---|
| **OpenFDA** | `https://api.fda.gov/drug/` | Health | None / Key | Public Health Reference | Drug adverse reactions, label warnings, recall alerts |
| **NPPES** | `https://npiregistry.cms.hhs.gov/api/` | Health | None | Public Provider Registry | Verifying NPI provider credentials and clinical practice location |
| **CMS Open Data** | `https://data.cms.gov/data-api/v1/` | Government | None / Key | Public Health Metrics | Quality payment benchmarks, clinical quality measures |
| **USDA FoodData** | `https://api.nal.usda.gov/fdc/v1/` | Food & Drink | `apiKey` | Public Nutrition | Nutritional profiles for diabetes / cardiovascular lifestyle triage |

---

## 4. Lifecycle & Change Detection
- **Review Trigger**: Any change in upstream authentication type, base URL, or HTTPS status flags the API as `REVIEW_REQUIRED` and pauses live queries until re-evaluated.
- **Deprecation**: If a provider endpoint goes offline or is delisted, it is marked `DEPRECATED` rather than immediately deleted, preserving audit history and historical prediction provenance.
- **Zero Static Responses**: If an approved API is offline, the gateway returns a standard unavailable state (`EXTERNAL_DATA_UNAVAILABLE`). No synthetic or fake data is ever generated.
