# Backend Setup & Local Development

This guide covers local environment setup, virtual environments, database migrations, and development server execution.

---

## 1. Prerequisites

- **Python:** `3.13` (or `3.11+`)
- **Neon Cloud PostgreSQL:** Valid connection string (`DATABASE_URL`)
- **Redis:** Redis 7 running locally or via Docker (`redis://localhost:6379/0`)

---

## 2. Installation Steps

1. Navigate to the backend directory:
   ```bash
   cd c:/4-1/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` in the repository root or backend folder:
   ```env
   DJANGO_SETTINGS_MODULE=config.settings.development
   DATABASE_URL=postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require
   REDIS_URL=redis://localhost:6379/0
   CELERY_BROKER_URL=redis://localhost:6379/0
   SECRET_KEY=dev-secret-key-change-in-prod
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the Daphne ASGI server:
   ```bash
   python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```
