# External API Security & SSRF Defense Architecture

> **Security Standard — BPY-CSE-2666**

---

## 1. Server-Side Request Forgery (SSRF) Defense

To prevent malicious SSRF attacks, DNS rebinding, and unauthorized intranet scanning:
1. **Pre-Flight DNS Resolution & IP Inspection**:
   - Before dispatching any HTTP request, the target hostname is resolved via standard DNS.
   - The resolved IPv4/IPv6 addresses are checked against forbidden network CIDRs:
     - `127.0.0.0/8` (IPv4 loopback)
     - `10.0.0.0/8` (Private RFC 1918)
     - `172.16.0.0/12` (Private RFC 1918)
     - `192.168.0.0/16` (Private RFC 1918)
     - `169.254.0.0/16` (IPv4 Link-local / Cloud Instance Metadata)
     - `::1` and `fe80::/10` (IPv6 loopback & link-local)
2. **Domain Allowlist Validation**:
   - Only URLs matching explicitly registered, approved base URLs in `ExternalAPIRegistry` are permitted.
3. **Protocol Enforcement**:
   - Only `https://` schemes are accepted for clinical workflows. Plaintext `http://` connections are blocked.
4. **No Direct User-Supplied URLs**:
   - The API Gateway constructs URLs using pre-approved endpoint paths. User input can only supply validated query parameter values (e.g. drug name, NPI).

---

## 2. Patient Data Boundary & PHI Exfiltration Prevention
- **Default DENY Policy**: No patient identifier (Name, MRN, ID, SSN, phone, email, address, DOB) or clinical measurement (vitals, diagnoses, medications, ML risk scores) is passed into external requests.
- **Request Inspection**: Outgoing query parameters and bodies are filtered through PHI regex detectors. If a potential identifier is detected, the request is aborted immediately and logged as a security alert.

---

## 3. Secret Management & Credential Isolation
- External API keys (e.g. `EXTERNAL_API_OPENFDA_KEY`, `EXTERNAL_API_USDA_KEY`) are read exclusively from secure server environment variables.
- Secrets are NEVER sent to the Next.js frontend, logged in audit files, stored in Git, or placed into Ruflo memory.

---

## 4. Resilience & Circuit Breaker State Machine
```
   [CLOSED] ──(3 consecutive failures)──► [OPEN]
      ▲                                     │
      │                               (60s cooldown)
  (1 success)                               ▼
      └───────── [HALF_OPEN] ◄──────────────┘
```
- **Timeouts**: Connection timeout = 3.0s, Read timeout = 5.0s, Maximum response size = 5MB.
- **Retries**: Up to 2 retries with exponential backoff and jitter for transient network errors (502, 503, 504). Zero retries on 400, 401, 403, 404, or 422.
