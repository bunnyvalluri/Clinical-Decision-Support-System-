# Bruno Collection Organization & Standards — HealthNova AI CDSS

## 1. Directory Structure

The collection is partitioned strictly by bounded clinical and technical domain to prevent sprawling monoliths:

```
bruno/
├── bruno.json
├── README.md
├── environments/
│   ├── Local.bru
│   ├── Development.bru
│   ├── Test.bru
│   ├── Staging.bru
│   └── Production.bru
├── auth/                       # Authentication, JWT, and Profile lifecycle
├── health/                     # System, DB, Redis, Celery health probes
├── users/                      # User management and role assignments
├── patients/                   # Patient demographic records and registration
├── doctors/                    # Doctor care-team workflows
├── nurses/                     # Nursing triage and vitals entry
├── informaticists/             # Informatics metrics and model drift
├── admin/                      # IT Admin user toggle and cluster status
├── predictions/                # ML Risk inference, retrieval, explanation
├── models/                     # Model registry versions and governance
├── reviews/                    # Pending reviews and clinical sign-offs
├── appointments/               # Patient portal appointments
├── notifications/              # Alerts and read-state management
├── ai/                         # Ruflo AI swarm, chat, traces, approvals
├── search/                     # Meilisearch query, facets, tenant tokens
├── nocodb/                     # NocoDB analytics datasets and sync
├── meilisearch/                # Meilisearch cluster admin and health
├── whiteboards/                # Excalidraw clinical whiteboards CRUD
├── security/                   # RBAC, IDOR, headers, and injection tests
│   ├── RBAC/                   # 5-Role matrix permission verification
│   ├── IDOR/                   # Object-level authorization boundary tests
│   ├── headers/                # HTTP security response headers
│   └── injection/              # Input sanitization and SQLi/XSS guards
├── external-apis/              # Gateway proxies (Drugs, Providers)
└── system/                     # Background tasks and metric endpoints
```

---

## 2. Naming Conventions

Every `.bru` file must follow the standard test identifier convention:

`[DOMAIN]-[ACTION]-[SEQUENCE_NUM].bru`

Examples:
- `AUTH-LOGIN-001.bru` (Successful doctor authentication)
- `AUTH-LOGIN-002.bru` (Rejection of invalid password)
- `PATIENT-READ-001.bru` (Doctor reading assigned patient record)
- `PATIENT-IDOR-001.bru` (Patient attempting unauthorized access to peer record)
- `PRED-CREATE-001.bru` (Executing ML risk inference with valid clinical vitals)
- `SEARCH-RBAC-001.bru` (Verifying nurse search scope restriction)
- `MEILI-HEALTH-001.bru` (Validating fast search projection cluster health)
- `NOCO-DATASET-001.bru` (Informaticist retrieving approved analytics dataset)
