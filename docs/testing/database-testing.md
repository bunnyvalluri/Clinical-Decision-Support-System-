# Database Constraint & Migration Testing

Tests in `tests/test_database_schema.py` verify:
- Unique constraints on MRN and user email.
- Soft-delete filters (`is_deleted=False`).
- Foreign key cascade protections (`ON DELETE PROTECT` on active models).
