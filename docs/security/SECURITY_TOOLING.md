# Security Tool Inventory & Version Pinning

## Tool Inventory & Capabilities

| Tool Name | Pinned Version | Category | Network Permissions | Risk Level | Execution Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Agentic-Bug-Hunter-Core** | 3.42.0 | Orchestration | Authorized internal endpoints only | LOW (Defensive) | Coordinates recon, API tests, and findings |
| **ValidationGate-7Q** | 1.2.0 | Policy Engine | In-process (No network) | NONE | Filters false positives & theoretical noise |
| **SecretRedactionEngine** | 2.0.0 | Sanitizer | In-process (No network) | NONE | Purges JWTs, keys, and PHI from traces |
| **SyntheticTestDataGenerator**| 1.0.0 | Test Fixture | In-process (No network) | NONE | Generates synthetic patient records & vitals |

## Pinned Invariants
- Security tools are never upgraded silently in production workflows.
- Offensive capabilities (e.g. brute force, credential spraying) are permanently disabled.
