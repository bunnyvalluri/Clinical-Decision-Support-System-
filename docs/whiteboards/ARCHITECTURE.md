# Clinical Whiteboard Platform Architecture

> **Project:** HealthNova AI (BPY-CSE-2666)  
> **Component:** Clinical Whiteboard & Collaborative Visualization Platform  
> **Authoritative Database:** Neon PostgreSQL  

---

## 1. High-Level Architecture Overview

The Clinical Whiteboard platform integrates `@excalidraw/excalidraw` as a client-side visualization layer within Next.js 16, backed by Django REST Framework and Django Channels for collaboration, with Neon PostgreSQL storing all metadata, documents, versions, and compliance audit records.

```
+---------------------------------------------------------------------------------------+
|                                  NEXT.JS 16 FRONTEND                                  |
|                                                                                       |
|  Role Dashboards:                                                                     |
|  /doctor/whiteboards      /nurse/whiteboards       /informaticist/whiteboards         |
|  /admin/whiteboards       /user/whiteboards                                           |
|                                                                                       |
|  Clinical Whiteboard Feature (`src/features/clinical-whiteboard/`):                   |
|  +---------------------------------------------------------------------------------+  |
|  | ExcalidrawClient (Dynamic Import, ssr: false, fixed light-mode)                 |  |
|  | WhiteboardToolbar (Clinical Decision Node, Triage Step, ML Model Badge)         |  |
|  | VersionHistoryDrawer (Checkpoints, restore with audit)                          |  |
|  | ClinicalReviewModal (Draft -> In Review -> Approved Locking)                     |  |
|  | AIDiagramDialog (Prompt 31 AI Gateway, Schema Validation, Preview, Approval)   |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            |
              REST APIs (HTTPS)             |         WebSockets (WSS)
                                            v
+-------------------------------------------+-------------------------------------------+
|                                DJANGO ASGI / REST API                                 |
|                                                                                       |
|  `apps.whiteboards`                                                                   |
|  - WhiteboardService: Lifecycle, ownership, and role queries                          |
|  - WhiteboardPersistenceService: Debounced autosave, SHA-256 versioning              |
|  - WhiteboardPermissionService: Object-level RBAC & patient authorization             |
|  - WhiteboardCollaborationConsumer: Django Channels WebSocket handler                |
|  - WhiteboardAIService: Safe structured diagram generation via Prompt 31              |
|  - WhiteboardExportService: Audit-logged PNG/SVG/JSON exports                         |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
       +----------------------------+ +------------+ +----------------------------+
       |      Neon PostgreSQL       | |   Redis    | |      Prompt 31 AI          |
       |  - ClinicalWhiteboard      | |  - WS Room | |  - AI Gateway              |
       |  - WhiteboardDocument      | |    Presence| |  - PromptSanitizer         |
       |  - WhiteboardVersion       | |  - Element | |  - RAG Guidelines          |
       |  - WhiteboardAsset         | |    Diffs   | |  - CitationGrounder        |
       |  - WhiteboardShare         | +------------+ +----------------------------+
       |  - WhiteboardAuditEvent    |
       +----------------------------+
```

---

## 2. Request & Collaboration Lifecycle

### 2.1 Viewing a Whiteboard
1. Next.js router navigates to `/<role>/whiteboards/<id>`.
2. REST request to `GET /api/v1/whiteboards/<id>/` executes `WhiteboardPermissionService.has_object_permission(user, whiteboard, 'VIEW')`.
3. If patient-linked, verifies clinician-patient relationship or self-service patient ownership.
4. Returns metadata and current `WhiteboardDocument` JSON.
5. Client-only `<ExcalidrawClient />` renders elements with `theme="light"`.

### 2.2 Autosave & Version Checkpoints
1. User edits canvas. Canvas triggers `onChange(elements, appState, files)`.
2. `useWhiteboardAutosave` debounces changes (3,000ms).
3. Secret scanning runs client-side and server-side to reject API keys/credentials.
4. Server computes SHA-256 hash of `document_json`. If changed, updates `WhiteboardDocument` and updates `updated_at`.
5. When an explicit checkpoint or clinical review approval occurs, a new immutable `WhiteboardVersion` snapshot is recorded.

### 2.3 Real-Time Multi-Clinician Collaboration
1. Browser opens WebSocket connection to `wss://<host>/ws/whiteboards/<id>/?token=<jwt>`.
2. Consumer validates user session and verifies `WHITEBOARD_EDIT` permission.
3. Consumer adds channel to Redis group `whiteboard_<id>`.
4. Client sends element delta updates.
5. Consumer broadcasts update to authorized room members.
6. Receiving clients invoke Excalidraw's `reconcileElements()` to merge concurrent edits deterministically.

---

## 3. Separation of Concerns & State

| Layer | Responsibility | Persistence |
| :--- | :--- | :--- |
| **Local Canvas State** | Viewport zoom, scroll, active selection, draft shapes | In-memory React state |
| **Session Collaboration State** | Live cursor coordinates, active user presence | Redis cache (8s TTL) |
| **Document State** | Active serialized Excalidraw elements, appState, files | Neon PostgreSQL `WhiteboardDocument` |
| **Version History** | Immutable milestone snapshots (v1, v2, v3...) | Neon PostgreSQL `WhiteboardVersion` |
| **Clinical Audit Log** | Immutable regulatory actions (`VIEW`, `EDIT`, `EXPORT`, etc.) | Neon PostgreSQL `WhiteboardAuditEvent` |

---

## 4. Healthcare Invariant Boundaries

1. **Non-Authoritative Status**: No drawn graphic or text box can override patient records or machine learning predictions.
2. **Deterministic Fallback**: If WebSocket or Redis is unreachable, the editor switches to safe offline degraded mode, notifying the user that edits are local until reconnected.
3. **White-Only Aesthetic**: No dark mode classes or dark canvas options are rendered.
