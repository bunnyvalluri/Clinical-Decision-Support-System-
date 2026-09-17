# Strix Security Validation Service (`usestrix/strix`)

## Overview
Strix is an advanced, automated security testing engine incorporated as a policy-governed DevSecOps validation tool in HealthNova AI.

## Architectural Boundaries
- **Container / Binary**: `usestrix/strix:1.0.2`
- **Adapter**: `apps.security_testing.services.strix_adapter.StrixSecurityAdapter`
- **Parser**: `apps.security_testing.services.strix_parser.StrixResultParser`
- **Execution Queue**: Celery `security_scans` queue
- **Policy Enforcement**: `apps.security_testing.services.policy_engine.SecurityPolicyEngine`

## Operational Modes
1. **Quick Review (`--mode quick`)**: Fast non-intrusive surface check.
2. **Standard Assessment (`--mode standard`)**: Evaluates REST endpoints, headers, and authentication tokens.
3. **Deep Assessment (`--mode deep`)**: Deep boundary inspection with proof-of-concept verification.

## Emergency Controls
To abort all security testing across the platform immediately:
- **API**: `POST /api/v1/security/kill-switch/` with `{"action": "activate", "reason": "Emergency stop"}`
- **Settings**: Set `SECURITY_KILL_SWITCH = True` in environment configuration.
