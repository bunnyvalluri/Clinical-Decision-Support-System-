# HealthNova AI CDSS — Bruno API Quality Platform

Welcome to the **Bruno API Quality and Contract Testing Suite** for the HealthNova AI Clinical Decision Support System.

## Directory Structure

```
bruno/
├── bruno.json                   # Collection root configuration
├── environments/                # Target environment profiles
│   ├── Local.bru
│   ├── Development.bru
│   ├── Test.bru
│   ├── Staging.bru
│   └── Production.bru
├── auth/                        # Token obtain, refresh, logout, profile
├── health/                      # Liveness, readiness, DB, Redis, Celery
├── users/                       # User management and roles
├── patients/                    # Patient registration, demographics, list
├── doctors/                     # Doctor care-team endpoints
├── nurses/                      # Nurse triage and vitals recording
├── informaticists/              # Informatics overview, data quality, drift
├── admin/                       # IT Admin user toggle and cluster status
├── predictions/                 # ML Risk predictions, detail, explanation
├── models/                      # Model versions and governance
├── reviews/                     # Clinical sign-offs and pending reviews
├── appointments/                # Patient appointments
├── notifications/               # Realtime alerts and notifications
├── ai/                          # Ruflo AI swarm, chat, MCP tools, traces
├── search/                      # Fast search projections, suggestions, facets
├── nocodb/                      # Analytics datasets, sync, and audit
├── meilisearch/                 # Search engine cluster health and index admin
├── whiteboards/                 # Clinical whiteboard collaboration
├── security/                    # 5-Role RBAC, IDOR, headers, and injection tests
│   ├── RBAC/
│   ├── IDOR/
│   ├── headers/
│   └── injection/
├── external-apis/               # Controlled external gateway proxies
└── system/                      # Background task tracking and metrics
```

## Running Tests

```bash
# Run all tests using Test environment
bru run --env Test

# Run specific folder
bru run health --env Local
bru run security/RBAC --env Local

# Output JUnit XML for CI
bru run --env Test --output reports/bruno/junit.xml --format junit
```

## Security & Healthcare Rules

1. **Safe Mode Enforced**: Run CLI with `--sandbox=safe`.
2. **Zero Real PHI**: Never commit real patient names, MRNs, or clinical vitals.
3. **Zero Secrets**: Do not commit passwords, secret tokens, or master keys.
4. **Authoritative Store**: Neon PostgreSQL remains the sole source of truth.
