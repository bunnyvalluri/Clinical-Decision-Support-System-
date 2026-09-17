# Firecrawl License Review & Governance Document

## 1. Component & License Identification

| Component | Pinned Version / Tag | Upstream Repository | License | Integration Method |
| :--- | :--- | :--- | :--- | :--- |
| **Firecrawl Core Engine** | `v1.10.2` | `https://github.com/firecrawl/firecrawl.git` | **AGPL-3.0** | Standalone containerized service (Clean Room Boundary) |
| **Firecrawl Python SDK** | `v1.10.x` / API Spec | `firecrawl-py` | **Apache-2.0 / MIT** | Python dependency / direct HTTP REST client |
| **Clinical Decision Support System (CDSS)** | `BPY-CSE-2666` | Internal Proprietary / Neon Cloud | **Proprietary / Strict Healthcare** | Host application |

---

## 2. AGPL-3.0 Compliance Analysis & Clean Room Boundary

### 2.1 The AGPL-3.0 Trigger
Section 13 of the GNU Affero General Public License (AGPL-3.0) mandates that if a covered work is modified and interacted with remotely through a computer network, the modified source code must be made available to network users.

### 2.2 Strict Invariant: Zero Source Code Contamination
To ensure complete legal compliance and protect the proprietary clinical ML algorithms, healthcare models, and patient security infrastructure:
1. **NO SOURCE CODE COPIED**: Absolutely no source code from `firecrawl/firecrawl` is copied, vendored, or compiled into the CDSS application repository.
2. **SERVICE-LEVEL INTEGRATION**: Firecrawl is treated as an external, isolated HTTP/JSON microservice running in its own container runtime.
3. **NETWORK BOUNDARY**: Communication occurs solely over standard HTTP REST protocols (`/v1/scrape`, `/v1/crawl`, `/v1/map`, `/v1/batch/scrape`, `/v1/search`, `/v1/extract`) with strictly typed JSON payloads. Under established legal standards, independent services communicating across an HTTP REST API boundary do not form a derivative work.
4. **UNMODIFIED UPSTREAM IMAGES**: When self-hosted (Mode B), unmodified official Docker images (pinned to `v1.10.2`) are deployed via Coolify/Docker. Because no upstream Firecrawl code is modified, no source distribution obligation is triggered.
5. **MANAGED CLOUD OPTION (Mode A)**: Alternatively, the managed Firecrawl Cloud API (`https://api.firecrawl.dev`) can be utilized without any local AGPL hosting.

---

## 3. Dependency License Governance

All Python and Node.js dependencies utilized in connecting to Firecrawl have been scanned for license compatibility:
- `requests` / `httpx`: Apache-2.0
- `pydantic`: MIT
- `beautifulsoup4`: MIT
- `channels`: BSD-3-Clause
- `celery`: BSD-3-Clause
- `redis`: MIT

No copyleft or GPL-tainted libraries are introduced into the runtime dependencies.

---

## 4. Legal Review & Upgrade Strategy

1. **Version Pinning**: All deployments must explicitly reference tag `v1.10.2`. Tracking `main` or `latest` is strictly forbidden in production.
2. **Upgrade Audit**: Prior to any minor or major version bump of Firecrawl:
   - Upstream LICENSE file must be inspected for dual-licensing or terms changes.
   - API contract changes must be tested against `backend/tests/test_firecrawl_integration.py`.
   - Security advisories (SSRF, remote code execution in Playwright) must be audited.
3. **Approved Decision**: Integration approved under Clean Room Service Architecture.
