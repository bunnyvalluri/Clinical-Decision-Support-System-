#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Django System Checks & Migrations Validation..."
cd backend
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.development}"
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate --noinput
echo "==> Django Validation & Migrations Succeeded."
