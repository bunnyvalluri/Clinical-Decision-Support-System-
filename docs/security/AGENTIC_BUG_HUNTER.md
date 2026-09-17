# Agentic-Bug-Hunter Integration — BPY-CSE-2666 DevSecOps Standard

## Overview
This document specifies the integration of the `Agentic-Bug-Hunter` architecture into the healthcare Clinical Decision Support System (`BPY-CSE-2666`).
Rather than serving as an unrestricted offensive penetration testing tool or scanning third-party internet targets, `Agentic-Bug-Hunter` is adapted as an **isolated, policy-governed internal security engineering and DevSecOps platform**.

## Key Healthcare Invariants
1. **Clinical Request Path Independence**: Security tooling is strictly excluded from clinical request lifecycles. Clinicians, triage nurses, and patients never invoke or pass through the security scanner.
2. **Zero Patient PHI Exposure**: All security testing operations run exclusively against synthetic datasets (`SyntheticSecurityDataGenerator`). Real patient records and MRNs are never supplied to scanners or LLMs.
3. **Strict Target Allowlist & Default-Deny**: No test can execute against an endpoint without explicit registration in the `SecurityTarget` registry and active dual-custody authorization.
4. **Validation-First Philosophy**: Implements the 7-question validation gate. Theoretical findings, missing headers without impact, or unverified scanner warnings are filtered as false positives.
5. **Deterministic Retesting**: Vulnerabilities are never marked `RESOLVED` without automated retest verification confirming the fix.

## Integration Topology

```
             Next.js Frontend (Hospital White-Only Theme)
                                 │
                                 ▼
                          Django REST API
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      ▼                          ▼                          ▼
Neon PostgreSQL               Redis                   Django Channels
(Authoritative DB)      (Broker & Cache)            (Realtime Alerts)
      │                          │                          │
Clinical Core                    │                  Realtime Dashboard
      │                          ▼                          │
ML Prediction              Celery Queue                     │
      │                  (security_scans)                   │
    Ruflo                        │                          │
(AI Swarm)                       ▼                          │
      │               Dedicated Security Worker             │
      │               (Resource & Timeout Limit)            │
      │                          │                          │
      └────────────────►         ▼                          │
                        AgenticBugHunterAdapter ────────────┘
                                 │
                        7-Question Gate
                                 │
                        Security Findings
                                 │
                        Human Review & Retest
```
