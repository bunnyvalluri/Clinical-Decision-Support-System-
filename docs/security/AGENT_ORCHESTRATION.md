# Security Agent Orchestration Architecture

## 1. Multi-Agent Hierarchy (Ruflo & Celery)
Ruflo acts as the policy-governed swarm coordinator:
1. **Coordinator**: Evaluates target authorization and task scoping.
2. **Specialized Agents**:
   - `Recon Agent`: Maps permitted endpoints.
   - `API Security Agent`: Analyzes parameter tampering and auth checks.
   - `IDOR Agent`: Validates multi-tenant boundaries.
   - `Validator Agent`: Executes the 7-question validation rubric.
   - `Report Writer`: Compiles draft findings for human review.
3. **Audit Trail**: Every execution state change is recorded in Neon PostgreSQL and broadcasted via Django Channels (`ws/security/agents/`).
