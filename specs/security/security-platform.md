# Strix DevSecOps Security Validation Platform Specification

## 1. Purpose & Scope
This specification defines the integration boundaries, operational controls, and lifecycle semantics for the Strix Security Validation Service (`usestrix/strix` v1.0.2) in the HealthNova Clinical Decision Support System.

## 2. Invariants & Guardrails
1. **Neon PostgreSQL Authority**: All security scans, findings, tool states, and audit trails must be recorded in Neon PostgreSQL.
2. **Zero-PHI Transmission**: Scans execute against synthetic test environments. No clinical records or patient identifiers are ever provided as targets or inputs.
3. **Clinical Request Path Isolation**: Security scans run on isolated worker instances; failure or degradation never impedes clinical workflows.
4. **Default-Deny Policy**: Any target not explicitly approved in the `SecurityTarget` registry with active authorization is blocked.
5. **Kill-Switch Invariant**: When `SECURITY_KILL_SWITCH = True`, all scan operations cease immediately.

## 3. Scan Profiles
| Profile | CLI Flag | Target Timeout | Description |
|---|---|---|---|
| `QUICK_SECURITY_REVIEW` | `quick` | 60s | Fast surface scan for high-risk misconfigurations & missing headers |
| `STANDARD_SECURITY_ASSESSMENT` | `standard` | 180s | Standard OWASP Top 10 API & authorization checks |
| `DEEP_SECURITY_ASSESSMENT` | `deep` | 300s | Comprehensive vulnerability verification with exploit proofing |

## 4. SARIF 2.1.0 Export Schema
All findings are mapped into OASIS SARIF 2.1.0 standard representation:
- Schema: `https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json`
- Rules: Mapped to vulnerability type, CWE identifier, and severity level.
- Locations: Code file/line or API endpoint URI.
