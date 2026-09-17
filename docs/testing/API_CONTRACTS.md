# Executable API Contracts Inventory — HealthNova AI CDSS

All active v1 REST endpoints and their corresponding Bruno contract definitions:

| Endpoint Route | HTTP Methods | Primary Contract ID | Expected Status | Bruno Collection File |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/health/` | GET | `HEALTH-LIVE-001` | 200 OK | `bruno/health/HEALTH-LIVE-001.bru` |
| `/api/v1/health/ready/` | GET | `HEALTH-READY-001` | 200 OK | `bruno/health/HEALTH-READY-001.bru` |
| `/api/v1/health/db/` | GET | `HEALTH-DB-001` | 200 OK | `bruno/health/HEALTH-DB-001.bru` |
| `/api/v1/health/redis/` | GET | `HEALTH-REDIS-001` | 200 OK | `bruno/health/HEALTH-REDIS-001.bru` |
| `/api/v1/auth/login/` | POST | `AUTH-LOGIN-001` | 200 OK | `bruno/auth/AUTH-LOGIN-001.bru` |
| `/api/v1/auth/token/refresh/` | POST | `AUTH-REFRESH-001` | 200 OK | `bruno/auth/AUTH-REFRESH-001.bru` |
| `/api/v1/auth/me/` | GET | `AUTH-ME-001` | 200 OK | `bruno/auth/AUTH-ME-001.bru` |
| `/api/v1/patients/` | GET, POST | `PATIENT-LIST-001` | 200 OK | `bruno/patients/PATIENT-LIST-001.bru` |
| `/api/v1/patients/{id}/` | GET, PUT, PATCH | `PATIENT-DETAIL-001` | 200 OK | `bruno/patients/PATIENT-DETAIL-001.bru` |
| `/api/v1/clinical/vitals/` | POST | `CLINICAL-VITALS-001` | 201 Created | `bruno/nurses/NURSE-VITALS-001.bru` |
| `/api/v1/clinical/triage/queue/` | GET | `CLINICAL-TRIAGE-001` | 200 OK | `bruno/nurses/NURSE-TRIAGE-001.bru` |
| `/api/v1/predictions/records/` | GET, POST | `PRED-CREATE-001` | 201 Created | `bruno/predictions/PRED-CREATE-001.bru` |
| `/api/v1/predictions/{id}/` | GET | `PRED-DETAIL-001` | 200 OK | `bruno/predictions/PRED-DETAIL-001.bru` |
| `/api/v1/predictions/{id}/explanation/` | GET | `PRED-SHAP-001` | 200 OK | `bruno/predictions/PRED-SHAP-001.bru` |
| `/api/v1/models/versions/` | GET | `MODEL-LIST-001` | 200 OK | `bruno/models/MODEL-LIST-001.bru` |
| `/api/v1/models/informatics/overview/` | GET | `MODEL-INFO-001` | 200 OK | `bruno/informaticists/INFO-OVERVIEW-001.bru` |
| `/api/v1/notifications/` | GET | `NOTIF-LIST-001` | 200 OK | `bruno/notifications/NOTIF-LIST-001.bru` |
| `/api/v1/ai/chat/` | POST | `AI-CHAT-001` | 200 OK | `bruno/ai/AI-CHAT-001.bru` |
| `/api/v1/ai/mcp/servers/` | GET | `AI-MCP-001` | 200 OK | `bruno/ai/AI-MCP-001.bru` |
| `/api/v1/search/` | POST | `SEARCH-QUERY-001` | 200 OK | `bruno/search/SEARCH-QUERY-001.bru` |
| `/api/v1/search/health/` | GET | `SEARCH-HEALTH-001` | 200 OK | `bruno/meilisearch/MEILI-HEALTH-001.bru` |
| `/api/v1/nocodb/datasets/` | GET | `NOCO-LIST-001` | 200 OK | `bruno/nocodb/NOCO-LIST-001.bru` |
| `/api/v1/whiteboards/` | GET, POST | `WHITEBOARD-CRUD-001` | 200 OK | `bruno/whiteboards/WHITEBOARD-CRUD-001.bru` |
| `/api/v1/admin/users/` | GET | `ADMIN-USERS-001` | 200 OK | `bruno/admin/ADMIN-USERS-001.bru` |
| `/api/v1/audit/` | GET | `AUDIT-LIST-001` | 200 OK | `bruno/security/AUDIT-LIST-001.bru` |
