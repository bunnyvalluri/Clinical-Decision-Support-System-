# Neon PostgreSQL Configuration

Neon is the cloud-native serverless PostgreSQL platform powering the PatientRisk CDSS backend.

---

## 1. Connection Configurations

Neon provides distinct connection endpoints:

```
+-----------------------------------------------------------------------------------+
| Neon PostgreSQL Cloud Instance                                                    |
|                                                                                   |
|  [ Direct Compute Endpoint ]                [ Pooled PgBouncer Endpoint ]         |
|  ep-tight-resonance-123456.neon.tech        ep-tight-resonance-123456-pooler.tech |
|  - Used for Schema Migrations               - Used for Django Web Workers         |
|  - Supports DDL, LISTEN/NOTIFY              - Manages Concurrency / Connection    |
|  - Direct connection to PostgreSQL engine   - Scale-to-zero friendly              |
+-----------------------------------------------------------------------------------+
```

### Environment Configuration
```env
# Pooled endpoint for application workers
DATABASE_URL=postgresql://neondb_owner:password@ep-tight-resonance-123456-pooler.c-2.neon.tech/neondb?sslmode=require

# Direct endpoint for migrations
DIRECT_DATABASE_URL=postgresql://neondb_owner:password@ep-tight-resonance-123456.c-2.neon.tech/neondb?sslmode=require
```

### Connection Pool Sizing
- `CONN_MAX_AGE = 600` (10 minutes) to reuse connections without leaking resources.
- PgBouncer operates in transaction-pooling mode.
