# Database Architecture & Schema Documentation
**Database Engine**: Neon Serverless PostgreSQL 18  
**Driver**: `psycopg2-binary` via `dj-database-url`

---

## 1. Schema Design Principles

1. **UUID Primary Keys**:
   All core tables use UUID v4 primary keys (`id`) to prevent enumeration attacks and support distributed systems.
2. **Soft Deletion**:
   Patient health records are never hard-deleted. They inherit from `SoftDeleteModel` with `is_deleted` and `deleted_at` fields.
3. **Audit Trails**:
   Every state modification (login, patient edit, risk assessment, export) is tracked in the `audit_logs` table.
4. **Timezones**:
   All timestamps are stored in UTC (`TIMESTAMP WITH TIME ZONE`).

---

## 2. Core Tables Overview

| Table Name | Description | Key Indexes |
| :--- | :--- | :--- |
| `accounts_user` | Custom user model with clinical roles | `email`, `role`, `is_active` |
| `audit_logs` | HIPAA-compliant system-wide audit trail | `(user, timestamp)`, `(resource_type, resource_id)` |
| `ml_models` | Machine learning model artifact registry | `(name, version)`, `is_active` |
| `django_celery_beat_*` | Scheduled background task execution | Periodic task schedules |
| `django_celery_results_*` | Async task execution results | Task IDs and status |
| `token_blacklist_*` | Revoked JWT refresh tokens | Blacklisted token hashes |

---

## 3. Connecting to the Database

Connection strings are stored exclusively in `.env`:
```text
DATABASE_URL="postgresql://neondb_owner:password@ep-divine-credit-a589ua8g-pooler.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

To run migrations:
```bash
python manage.py migrate
```

To seed initial users:
```bash
python manage.py seed_clinical_users
```
