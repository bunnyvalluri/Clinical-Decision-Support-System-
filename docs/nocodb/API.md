# NocoDB API Specification & Integration Contracts

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Base Path:** `/api/v1/nocodb/`

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/nocodb/health/` | Service health status, DB connectivity, sync status | All Authenticated |
| `GET` | `/api/v1/nocodb/datasets/` | List accessible datasets for caller's role | All Authenticated |
| `GET` | `/api/v1/nocodb/datasets/<id>/` | Get dataset details and column schema | All Authenticated |
| `GET` | `/api/v1/nocodb/datasets/<id>/rows/` | Query dataset rows with filtering, pagination, sorting | Role Permitted |
| `POST` | `/api/v1/nocodb/datasets/<id>/rows/` | Insert row into dataset (analytical datasets only) | Informaticist, Admin |
| `PATCH` | `/api/v1/nocodb/datasets/<id>/rows/<row_id>/` | Update row in dataset | Informaticist, Admin |
| `DELETE` | `/api/v1/nocodb/datasets/<id>/rows/<row_id>/` | Delete row in dataset | Admin |
| `GET` | `/api/v1/nocodb/datasets/<id>/export/` | Export dataset to CSV/JSON with formula sanitization | Informaticist, Admin, Doctor |
| `GET` | `/api/v1/nocodb/audit-logs/` | Query immutable NocoDB access/mutation logs | Admin, Informaticist |
| `POST` | `/api/v1/nocodb/sync/trigger/` | Trigger manual analytical data sync from Neon | Admin, Informaticist |
| `POST` | `/api/v1/nocodb/mcp/execute/` | Execute guarded MCP tool call | Admin, Ruflo Agent |

---

## 2. Request & Response Payloads

### GET `/api/v1/nocodb/datasets/<id>/rows/`
**Query Parameters:**
- `page`: Integer (default 1)
- `page_size`: Integer (default 25, max 100)
- `sort`: String (e.g. `-created_at`, `risk_score`)
- `search`: String (global text query)
- `filter[<column>]`: String filter match

**Response (200 OK):**
```json
{
  "dataset_id": "ml_predictions_monitoring",
  "dataset_title": "ML Predictions Monitoring",
  "total_rows": 142,
  "page": 1,
  "page_size": 25,
  "columns": [
    {"name": "id", "type": "Number", "is_primary": true},
    {"name": "anon_patient_token", "type": "SingleLineText", "is_phi": false},
    {"name": "risk_score", "type": "Number", "precision": 4},
    {"name": "risk_tier", "type": "Select", "options": ["Low", "Moderate", "High", "Critical"]},
    {"name": "model_version", "type": "SingleLineText"},
    {"name": "evaluated_at", "type": "DateTime"},
    {"name": "clinician_reviewed", "type": "Checkbox"}
  ],
  "rows": [
    {
      "id": 1,
      "anon_patient_token": "PT-7F8A2D",
      "risk_score": 0.8421,
      "risk_tier": "High",
      "model_version": "xgb_sepsis_v2.4",
      "evaluated_at": "2026-09-17T10:15:00Z",
      "clinician_reviewed": true
    }
  ]
}
```
