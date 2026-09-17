# NocoDB License Analysis & Compliance Verification

> **Software:** NocoDB (`https://github.com/nocodb/nocodb`)  
> **Target System:** HealthNova AI (BPY-CSE-2666)  
> **License Identified:** Sustainable Use License (SUL) 1.0 (Fair-Code / Source-Available)  

---

## 1. Executive Summary

NocoDB previously operated under the GNU Affero General Public License v3 (AGPL-3.0). The project officially transitioned its `master` and `develop` branches to the **Sustainable Use License (SUL) 1.0**.

The Sustainable Use License is a "fair-code" or source-available software license designed to permit internal organizational use, research, and modification, while explicitly restricting third parties from offering the software as a competing hosted, managed, or SaaS product without a commercial license from NocoDB Inc.

---

## 2. Permitted Use Under SUL 1.0 for HealthNova AI

1. **Internal Hospital & Enterprise Use**:
   - HealthNova AI utilizes NocoDB as an internal clinical decision support data workspace, operational analytics layer, and medical informatics interface for hospital staff.
   - This constitutes direct internal organizational usage, which is fully permissible under the terms of the Sustainable Use License.
2. **Self-Hosting on Premise / Neon Infrastructure**:
   - Deploying NocoDB in a self-hosted Docker container alongside Django, Redis, and Neon PostgreSQL complies with SUL 1.0 guidelines.
3. **No Third-Party Hosted SaaS Offering**:
   - HealthNova AI does NOT resell NocoDB as a multi-tenant database-as-a-service or standalone spreadsheet SaaS to external third parties.

---

## 3. Package-Level Licensing Review

| Monorepo Component | License | Notes |
| :--- | :--- | :--- |
| `packages/nocodb` | Sustainable Use License 1.0 | Backend core server |
| `packages/nc-gui` | Sustainable Use License 1.0 | Frontend Vue/Nuxt user interface |
| `packages/nc-sdk` | MIT License | Programmatic client SDK |
| `packages/nocodb-sdk`| MIT License | HTTP API wrapper |

---

## 4. Compliance Verification Checklist

- [x] No commercial redistribution of NocoDB source code as a competing product.
- [x] No third-party database hosting service marketed under NocoDB trademarks.
- [x] All modifications to integration wrappers remain within HealthNova AI private boundaries.
- [x] All copyright notices and license attributions preserved in documentation.
