# Database Migrations Workflow

Django manages schema evolution through the `python manage.py migrate` framework.

---

## 1. Safe Production Migration Rules

1. **Direct Connection:** Always execute migrations using the unpooled direct endpoint (`DIRECT_DATABASE_URL`), as PgBouncer connection pools do not support transactional DDL.
2. **Backward-Compatible Alterations:** When adding new columns, always define them as nullable (`null=True`) or with safe database defaults.
3. **Branch-First Migration Validation:**
   - Create a temporary Neon branch from production.
   - Execute `python manage.py migrate` on the branch.
   - Verify application smoke tests pass.
   - Apply migrations to the primary production branch.
