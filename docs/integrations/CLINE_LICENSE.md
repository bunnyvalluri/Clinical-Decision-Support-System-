# License Compliance & Verification — Cline Integration

> **Target Package**: Cline Agent Engine (`https://github.com/cline/cline.git`)  
> **Upstream License**: Apache License 2.0  
> **HealthNova AI CDSS License**: Proprietary Enterprise Healthcare Application  
> **Audit Status**: VERIFIED & COMPLIANT  

---

## 1. Upstream License Analysis

Cline is released under the permissive **Apache License, Version 2.0**.

### Permitted Capabilities under Apache 2.0:
- **Commercial Use**: Software may be utilized in commercial healthcare deployments.
- **Modification**: Code and interfaces may be modified, adapted, and extended.
- **Distribution**: Artifacts derived from the code may be distributed under terms preserving copyright notices.
- **Patent Grant**: Express grant of patent rights from contributors.

### Obligations & Non-Negotiable Terms:
1. **Notice Preservation**: Copyright, patent, trademark, and attribution notices from upstream Cline must be retained in distributed components.
2. **State Changes**: Prominent notices must indicate any files modified from upstream.
3. **No Trademark Grant**: Cline trademarks and logos cannot be used to endorse clinical diagnoses or services without permission.
4. **Disclaimer of Warranty**: Upstream Cline is provided "AS IS" without clinical warranties. HealthNova AI CDSS enforces deterministic safety guardrails and human-in-the-loop validation before any recommendation reaches a clinician.

---

## 2. Dependency Tree & Healthcare Compatibility

| Component / Layer | License | Commercial CDSS Suitability | Notes |
| :--- | :--- | :--- | :--- |
| **@cline/sdk** | Apache-2.0 | Approved | Embedded via adapter boundary |
| **Node / Bun Engine** | MIT / LGPL | Approved | Run in isolated sandboxed workers |
| **Model Context Protocol (MCP)** | MIT | Approved | Sandboxed tool protocol |
| **Neon PostgreSQL Driver** | Apache-2.0 / MIT | Approved | Sole authoritative clinical store |
| **Django Framework** | 3-Clause BSD | Approved | Authoritative business logic |

---

## 3. Compliance Summary

The controlled integration of Cline into the HealthNova Clinical Decision Support System complies fully with Apache 2.0 terms. No copyleft viral licenses (e.g. GPL-3.0) are introduced into the proprietary application core.
