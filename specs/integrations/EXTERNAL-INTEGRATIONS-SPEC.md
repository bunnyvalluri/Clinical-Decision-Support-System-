# External & Auxiliary Integrations Specification

**Spec ID**: `INTEG-SPEC-001`  
**Domain**: Auxiliary Services, Tooling Boundaries, & Safe Integration  
**Status**: `CONVERGED`  
**Components**: Meilisearch, PocketBase, NocoDB, SmsForwarder, Excalidraw  

---

## 1. Auxiliary Tool Boundaries (Non-Authoritative)

| Tool / System | Permitted Purpose | Prohibited Usage | Authoritative Sync |
| :--- | :--- | :--- | :--- |
| **Meilisearch** | Fast hybrid search for guidelines and non-sensitive patient index | Storing authoritative patient records or clinical diagnosis | Read-only index synced asynchronously via Celery |
| **PocketBase** | Temporary developer scratchpad, mock client staging | Primary persistence of clinical vitals or predictions | Zero production traffic |
| **NocoDB** | Internal administrative workspace and tabular visualization | Primary clinical database or bypassing Django RBAC | Read-only view on non-PHI tables |
| **SmsForwarder** | Gateway for outbound critical bedside SMS alerts to nurses | Receiving arbitrary inbound SMS commands | Outbound-only via verified phone allowlist |
| **Excalidraw** | Clinical whiteboard collaboration & visual risk diagramming | Storing definitive diagnostic decisions | Diagram assets stored as de-identified SVG/JSON |

---

## 2. Egress & SSRF Protection
- Outbound external API calls must pass an approved domain allowlist.
- Internal metadata endpoints (`169.254.169.254`, `localhost`, `127.0.0.1`) are strictly blocked.
- Timeout limits: Max 5s connection, max 10s total timeout with exponential backoff.
