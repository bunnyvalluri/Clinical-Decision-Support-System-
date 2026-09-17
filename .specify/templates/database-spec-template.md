# Database Migration Specification: [MIGRATION NAME]

**DB Spec ID**: `DB-[DOMAIN]-[SEQ]`  
**App Name**: `backend/apps/[app]`  
**Migration File**: `00XX_[migration_name].py`  
**Authoritative Store**: Neon PostgreSQL  
**Change Classification**: `Level 3 (Schema Change) | Level 4 (Clinical Core Table)`  

---

## 1. Schema Invariants & Entities
- **Table Name**: `[table_name]`
- **Columns Added / Modified**:
  | Column Name | Data Type | Constraints | Default | Nullable | Index |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | id | UUID | PRIMARY KEY | uuid4 | False | Primary |
  | patient_id | UUID | FK -> patients.id | CASCADE | False | B-Tree |
  | risk_score | Numeric(5,4) | CHECK (0 <= risk_score <= 1) | None | False | B-Tree |
  | risk_level | Varchar(20) | CHECK (IN ('LOW', 'MEDIUM', 'HIGH')) | None | False | B-Tree |
  | created_at | TimestampTZ | auto_now_add | now() | False | BRIN/B-Tree |

---

## 2. Relational Integrity & Constraints
- **Foreign Key Constraints**: `ON DELETE CASCADE` or `ON DELETE PROTECT` (sensitive clinical records must default to `PROTECT`).
- **Unique Constraints**: composite uniqueness where applicable.
- **Check Constraints**: Value domain validation directly at PostgreSQL level.

---

## 3. Migration Safety & Zero-Downtime Analysis
- [ ] Non-blocking: Migration does not acquire exclusive table locks for > 100ms.
- [ ] Safe Column Addition: New columns are either nullable or have a database-level safe default.
- [ ] Index Creation: Large table indices created concurrently if necessary.
- [ ] Backward Compatibility: Existing API serializers function normally before and after migration.

---

## 4. Rollback Plan
- Reversal command: `python manage.py migrate [app] [previous_migration_number]`
- Data preservation verification during rollback.
