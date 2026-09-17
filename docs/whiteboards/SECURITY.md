# Clinical Whiteboard Security Architecture

> **Standards:** OWASP Top 10, STRIDE Threat Model, HIPAA Security Rule  
> **Target:** HealthNova AI Whiteboards (`apps.whiteboards`)  

---

## 1. Threat Modeling (STRIDE)

| Threat | Risk Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates a doctor to join a private care-plan session. | JWT authentication on WebSocket handshake + session token validation in Django Channels middleware. |
| **Tampering** | Man-in-the-middle alters clinical decision diagram elements. | TLS 1.3 encryption (HTTPS/WSS) + SHA-256 document content hashing on every save. |
| **Repudiation** | Clinician denies modifying or approving an emergency care pathway. | Immutable `WhiteboardAuditEvent` capturing user ID, role, action, timestamp, IP, and version snapshot. |
| **Information Disclosure** | Unauthorized user accesses patient-linked whiteboard via IDOR. | Object-level authorization in `WhiteboardPermissionService` verifying clinician-patient clinical relationship. |
| **Denial of Service** | Malicious actor posts 100MB canvas payload or floods WebSocket room. | Strict payload limits (max 10MB, max 5,000 elements) + Redis token bucket rate limiting. |
| **Elevation of Privilege** | Nurse or Patient attempts to approve clinical diagrams or view IT architecture. | Strict RBAC matrix; `ClinicalReviewModal` and approval endpoints require `DOCTOR` or `ADMIN` role. |

---

## 2. Object-Level Access Control Matrix

| Whiteboard Classification | DOCTOR | NURSE | MEDICAL INFORMATICIST | IT ADMIN | PATIENT |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **PUBLIC** | Full | Full | Full | Full | Read-Only |
| **INTERNAL** | Full | Full | Full | Full | Forbidden |
| **SENSITIVE** | Authorized Only | Authorized Only | Authorized Only | View (Audited) | Forbidden |
| **PHI** (Patient-Linked) | Clinical Relation Only | Assigned Only | Masked Research Only | Forbidden (No PHI) | Own Board Only |
| **RESTRICTED** | Owner / Explicit | Owner / Explicit | Owner / Explicit | Admin Management | Forbidden |

---

## 3. Secret Scanning Engine

To prevent accidental inclusion of credentials, connection strings, or access tokens in whiteboard annotations, `SecretScanner` runs pre-save validation against both client and backend:
- **API Keys**: Patterns for `sk-[a-zA-Z0-9]{32,}`, `ghp_[a-zA-Z0-9]{36}`, `AKIA[0-9A-Z]{16}`.
- **Database URLs**: `postgres://`, `redis://`, `mongodb://`.
- **JWTs**: `ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*`.
- **Private Keys**: `-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----`.

If any pattern matches, the save operation is rejected with `WHITEBOARD_SECRET_DETECTED` and the specific matched key pattern is displayed to the author for redaction.

---

## 4. SVG & Asset Security

Excalidraw supports image uploads and SVG exports. Malicious SVG payloads can contain embedded JavaScript (`<script>`, `onload=`, `javascript:` URLs).
- **MIME & Extension Whitelist**: Only `image/png`, `image/jpeg`, and `image/svg+xml` are accepted.
- **Sanitization**: All uploaded and exported SVGs are sanitized using `defusedxml` and strict tag whitelisting, stripping all scripts, foreign objects, and external entity references.
- **Content Security Policy (CSP)**:
  `default-src 'self'; script-src 'self'; img-src 'self' data: blob:; connect-src 'self' wss: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;`
