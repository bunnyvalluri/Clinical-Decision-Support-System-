# Real-Time Whiteboard Collaboration Architecture

> **Protocol:** WebSockets over ASGI (Django Channels)  
> **Channel Layer:** Redis Cluster / In-Memory Redis  
> **Reconciliation Engine:** Excalidraw `reconcileElements` Fractional Indexing  

---

## 1. Collaboration Protocol Overview

Real-time collaboration synchronizes canvas operations across multiple authorized clinicians working on the same clinical care plan or architecture diagram.

```
Clinician A Browser               Django Channels (ASGI)               Clinician B Browser
        |                                   |                                   |
        |--- 1. WS Connect with Token ---->|                                   |
        |    (/ws/whiteboards/<id>/)        |                                   |
        |<-- 2. WHITEBOARD_JOINED ---------|                                   |
        |    (Sends active user list)       |--- 3. Broadcast JOINED ---------->|
        |                                   |                                   |
        |--- 4. Element Delta (Mouse Up) ->|                                   |
        |    (Ordered elements + version)   |--- 5. Broadcast UPDATED --------->|
        |                                   |    (Clinician B runs              |
        |                                   |     reconcileElements)            |
        |                                   |                                   |
        |--- 6. Pointer Movement ---------->|--- 7. Broadcast PRESENCE -------->|
        |    (X, Y, User Name)              |    (Renders live cursor)          |
        |                                   |                                   |
        |<-- 8. WHITEBOARD_SAVED -----------|--- 9. Broadcast SAVED ----------->|
        |    (Version checkpoint)           |    (Updates save indicator)       |
```

---

## 2. Event Types & Payloads

### `WHITEBOARD_JOINED`
Emitted when a collaborator connects and verifies object permissions.
```json
{
  "type": "WHITEBOARD_JOINED",
  "whiteboard_id": "8fa88920-5573-421d-9653-062e74288019",
  "user_id": "4b68e592-7ef6-4107-8ad4-d3056079be82",
  "name": "Dr. Sarah Jenkins, MD",
  "role": "DOCTOR",
  "active_collaborators": [
    { "user_id": "4b68e592-7ef6-4107-8ad4-d3056079be82", "name": "Dr. Sarah Jenkins, MD", "role": "DOCTOR" }
  ]
}
```

### `WHITEBOARD_UPDATED`
Broadcasts element changes using version and fractional indexing metadata.
```json
{
  "type": "WHITEBOARD_UPDATED",
  "whiteboard_id": "8fa88920-5573-421d-9653-062e74288019",
  "sender_id": "4b68e592-7ef6-4107-8ad4-d3056079be82",
  "elements": [ /* Serialized Excalidraw Element array */ ],
  "app_state": { "theme": "light" }
}
```

### `WHITEBOARD_LOCKED` / `WHITEBOARD_UNLOCKED`
Emitted when a whiteboard enters clinical review or is approved by an attending physician.
```json
{
  "type": "WHITEBOARD_LOCKED",
  "whiteboard_id": "8fa88920-5573-421d-9653-062e74288019",
  "status": "APPROVED",
  "locked_by": "Dr. Marcus Vance, MD",
  "version": 3
}
```

---

## 3. Conflict Resolution Strategy

1. **Fractional Indexing**: Each element contains an index string (e.g. `"a0"`, `"a1"`). Inserting between two elements generates an intermediate index (e.g. `"a0V"`), avoiding array re-indexing conflicts.
2. **Version Nonce & Timestamps**: If two clinicians modify the exact same element simultaneously, `reconcileElements()` selects the element with the higher `version` number or higher `versionNonce` in the event of equal versions.
3. **Optimistic Local Update**: Edits render locally instantly, guaranteeing zero input lag on canvas drawing.
