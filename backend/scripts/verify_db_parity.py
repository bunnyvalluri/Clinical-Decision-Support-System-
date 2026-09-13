import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django
django.setup()

from django.db import connection
from django.apps import apps

def main():
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, version();")
        row = cursor.fetchone()
        print(f"Connected DB: {row[0]} | User: {row[1]}")
        print(f"Postgres Version: {row[2][:50]}")
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = set(t[0] for t in cursor.fetchall())
        print(f"Total public tables in Neon PostgreSQL: {len(tables)}")

    models = apps.get_models()
    missing = []
    found = 0
    for m in models:
        table = m._meta.db_table
        if table in tables:
            found += 1
        else:
            missing.append(table)

    print(f"Django models: {len(models)} | Matched in DB: {found} | Missing: {len(missing)}")
    if missing:
        print(f"Missing tables: {missing}")
    else:
        print("PERFECT MATCH: All Django model tables exist in Neon PostgreSQL.")

if __name__ == "__main__":
    main()
