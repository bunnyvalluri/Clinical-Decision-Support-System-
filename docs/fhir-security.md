# HealthNova AI — FHIR Interoperability Security & Governance Specification

> **Security Baseline:** HIPAA Security Rule, HITECH, Zero-Trust Architecture  
> **Threat Mitigation:** SSRF, IDOR, XML Injection, JSON Resource Exhaustion, PHI Exfiltration  
> **Document Identifier:** HN-FHIR-SEC-2026

---

## 1. Threat Matrix & Defensive Countermeasures

| Threat Vector | Severity | Vulnerability Mechanism | HealthNova Countermeasure |
| :--- | :--- | :--- | :--- |
| **Server-Side Request Forgery (SSRF)** | CRITICAL | Malicious webhook/FHIR endpoint URL targeting cloud metadata (`169.254.169.254`) or internal VPC services. | `InteroperabilityHTTPClient` validates hostnames via DNS resolution before socket connect; strictly blocks all RFC1918 subnets, IPv6 link-local, and loopback addresses. |
| **Insecure Direct Object Reference (IDOR)** | HIGH | Attacker attempts to retrieve or export arbitrary patient FHIR bundles by iterating UUIDs. | Strict object-level RBAC filters ensure patients can only request their own records, and clinicians can only access patients assigned to their facility. |
| **JSON Parser Denial of Service** | MEDIUM | Gigabyte-sized payloads or deeply nested JSON structures designed to exhaust server RAM. | Strict 10MB payload size limit enforced at Nginx/Django middleware; recursive depth limits on JSON deserialization. |
| **Silent Clinical Data Overwrite** | HIGH | External untrusted partner sends partial update overwriting authoritative laboratory or vital measurements. | `OverwriteProtectionError` raised if external update conflicts with verified internal clinical entries. Requires explicit human review. |
| **PHI Leakage in Audit Trails / Logs** | CRITICAL | Patient names, contact info, or identifiers logged to monitoring stacks or OpenTelemetry spans. | `FHIRAuditLogger` redacts patient identifiers from descriptions; payloads stored in encrypted Neon columns with access limited to compliance officers. |

---

## 2. Protected Outbound Client Specifications

All external requests dispatched by Celery workers or synchronization jobs utilize `InteroperabilityHTTPClient`:
- **Timeout Enforced:** Default 15-second connect and read timeout prevents thread starvation.
- **SSL Certificate Verification:** Mandatory certificate validation against public CA bundle (`verify=True`).
- **Private Network Blacklist:**
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8` (Private Class A)
  - `172.16.0.0/12` (Private Class B)
  - `192.168.0.0/16` (Private Class C)
  - `169.254.0.0/16` (Link-Local / Cloud Metadata)
  - `::1`, `fe80::/10` (IPv6 equivalents)
