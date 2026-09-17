# Security Targets Registry & Default-Deny Policy

## Target Registration Standard
All endpoints targeted for security testing must be pre-approved and documented within the `SecurityTarget` allowlist.

### Required Target Attributes
- **Target Name**: Unique descriptive identifier (e.g. `Local Staging API Gateway`).
- **Environment**:
  - `DEVELOPMENT`: Permitted for developer unit security audits.
  - `SECURITY_TEST`: Dedicated isolated security test lab.
  - `STAGING`: Authorized staging environments with temporary tokens.
  - `PRODUCTION`: Strictly disabled by default.
- **Protocol**: HTTP, HTTPS, WS, or WSS.
- **Hostname & Port**: Fully qualified internal domain or localhost binding.
- **Allowed Scope**: Comma-separated or JSON list of permitted path prefixes.
- **Allowed Tests**: Allowlisted test categories (e.g. `RBAC_CHECK`, `IDOR_CHECK`, `SSRF_CHECK`).
- **Forbidden Tests**: Operations permanently blocked (e.g. `DESTRUCTIVE_WRITE`, `CREDENTIAL_SPRAYING`, `DENIAL_OF_SERVICE`).
- **Approval Lifecycle**: Requires approval by an IT Administrator with explicit expiration (`approval_expires_at`).

## Default-Deny Rules
1. Any target not registered in `SecurityTarget` is rejected immediately with HTTP 403 / state `BLOCKED`.
2. Any scan requesting a test type present in `forbidden_tests` is aborted.
3. Any scan whose target has an expired approval timestamp is rejected.
