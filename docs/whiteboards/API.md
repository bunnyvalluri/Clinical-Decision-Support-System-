# Clinical Whiteboard API & WebSocket Specification

> **Base URL:** `/api/v1/whiteboards/`  
> **WebSocket URL:** `ws://<host>/ws/whiteboards/<whiteboard_id>/?token=<jwt_token>`  
> **Authoritative Database:** Neon PostgreSQL  

---

## 1. REST Endpoints

### 1.1 List & Filter Whiteboards
- **Method / Endpoint**: `GET /api/v1/whiteboards/`
- **Query Params**:
  - `type`: e.g. `CARE_PLAN`, `CLINICAL_WORKFLOW`, `DECISION_TREE`
  - `classification`: `PUBLIC`, `INTERNAL`, `SENSITIVE`, `PHI`, `RESTRICTED`
  - `status`: `DRAFT`, `IN_REVIEW`, `APPROVED`, `ARCHIVED`
  - `patient_id`: UUID
  - `search`: Full text search on title and description
- **Response**: Paginated list of `ClinicalWhiteboard` metadata objects.

### 1.2 Create Whiteboard
- **Method / Endpoint**: `POST /api/v1/whiteboards/`
- **Payload**:
  ```json
  {
    "title": "Ward 4B Sepsis Decision Pathway",
    "description": "Standardized escalation protocol for suspected sepsis",
    "type": "DECISION_TREE",
    "classification": "INTERNAL",
    "patient_id": null,
    "initial_elements": []
  }
  ```
- **Response**: `201 Created` with full whiteboard details and initial version document (v1).

### 1.3 Get Whiteboard by ID
- **Method / Endpoint**: `GET /api/v1/whiteboards/<id>/`
- **Response**: Complete whiteboard object including current `document` (elements, appState, files, version_number).

### 1.4 Update Whiteboard Metadata
- **Method / Endpoint**: `PATCH /api/v1/whiteboards/<id>/`
- **Payload**: `{ "title": "Updated Title", "description": "...", "tags": ["sepsis", "icu"] }`

### 1.5 Autosave / Update Document
- **Method / Endpoint**: `PUT /api/v1/whiteboards/<id>/document/`
- **Payload**:
  ```json
  {
    "elements": [...],
    "appState": { "viewBackgroundColor": "#ffffff" },
    "files": {},
    "is_checkpoint": false,
    "checkpoint_summary": ""
  }
  ```
- **Response**: `{ "saved": true, "version_number": 3, "content_hash": "...", "updated_at": "..." }`

### 1.6 Version Management & Restore
- **`GET /api/v1/whiteboards/<id>/versions/`**: List all version checkpoints.
- **`POST /api/v1/whiteboards/<id>/restore/`**:
  ```json
  {
    "target_version": 2,
    "reason": "Rollback to pre-incident triage protocol"
  }
  ```
  Creates a new version representing the restored state and logs an immutable audit event.

### 1.7 Clinical Review Workflow
- **`POST /api/v1/whiteboards/<id>/review/`**:
  ```json
  {
    "action": "APPROVE", // or "REQUEST_CHANGES", "SUBMIT_FOR_REVIEW"
    "comments": "Approved for clinical use by Dr. Sarah Jenkins (Cardiology Lead)"
  }
  ```
  Enforces locking upon `APPROVE`.

### 1.8 AI Diagram Generation
- **`POST /api/v1/whiteboards/<id>/ai-generate/`**:
  ```json
  {
    "prompt": "Create a clinical flowchart for diabetic ketoacidosis (DKA) insulin titration",
    "clinical_guideline_category": "ENDOCRINOLOGY"
  }
  ```
  Returns structured Excalidraw elements for preview with guideline citations.

### 1.9 Controlled Sharing & Token Revocation
- **`POST /api/v1/whiteboards/<id>/share/`**:
  ```json
  {
    "target_role": "NURSE",
    "expires_in_hours": 48,
    "allow_edit": false
  }
  ```
- **`POST /api/v1/whiteboards/<id>/revoke-share/`**: Revokes active share token.

---

## 2. WebSocket Collaboration Protocol

- **Endpoint**: `/ws/whiteboards/<whiteboard_id>/?token=<jwt_token>`
- **Handshake Requirements**:
  1. Valid user token.
  2. Object-level permission verification on `<whiteboard_id>`.
  3. Patient boundary checks (PHI classification checks).

### Message Types:
| Message Type | Direction | Payload Structure |
| :--- | :--- | :--- |
| `WHITEBOARD_JOIN` | Client -> Server | `{ "type": "WHITEBOARD_JOIN" }` |
| `USER_JOINED` | Server -> Clients| `{ "type": "USER_JOINED", "user": { "id", "name", "role", "color" } }` |
| `WHITEBOARD_UPDATE` | Client -> Server | `{ "type": "WHITEBOARD_UPDATE", "elements": [...], "version": 4 }` |
| `WHITEBOARD_BROADCAST`| Server -> Clients| `{ "type": "WHITEBOARD_BROADCAST", "sender_id", "elements": [...] }` |
| `CURSOR_MOVE` | Client -> Server | `{ "type": "CURSOR_MOVE", "x": 350, "y": 420 }` |
| `CURSOR_BROADCAST` | Server -> Clients| `{ "type": "CURSOR_BROADCAST", "user_id", "x", "y" }` |
| `WHITEBOARD_LOCK` | Server -> Clients| `{ "type": "WHITEBOARD_LOCK", "is_locked": true, "locked_by" }` |
| `USER_LEFT` | Server -> Clients| `{ "type": "USER_LEFT", "user_id" }` |
