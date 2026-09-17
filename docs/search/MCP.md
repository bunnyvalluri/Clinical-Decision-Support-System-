# Model Context Protocol (MCP) Search Gateway

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** AI Agent Search Tools Specification (`SearchMCPGateway`)  

---

## 1. Tool Allowlist & Access Policies

AI agents (such as Ruflo v3.42.0) are strictly limited to **read-only, audited tools**. Autonomous index creation, index deletion, document mutation, or settings modification are strictly forbidden.

### Available MCP Tools:

1. `search_authorized_index`
   - **Description:** Search within an approved index on behalf of an authenticated clinician session.
   - **Parameters:** `index_name` (string), `query` (string), `filters` (optional object), `limit` (optional integer, max 20).
   - **Security:** Evaluates the clinician's role before executing the query.

2. `get_search_schema`
   - **Description:** Retrieve the documented fields, filters, and attributes for a specified index.
   - **Parameters:** `index_name` (string).
   - **Security:** Public schema definition only.

3. `get_document_by_authorized_id`
   - **Description:** Fetch a single indexed document projection by ID.
   - **Parameters:** `index_name` (string), `document_id` (string).
   - **Security:** Verifies caller authorization for that specific entity.

4. `search_clinical_knowledge`
   - **Description:** Search approved clinical guidelines, medical protocol documents, and risk scoring calculators.
   - **Parameters:** `query` (string), `specialty` (optional string).
