# Patient Risk Level Prediction — Clinical Decision Support System
## BPY-CSE-2666

> **⚠️ Clinical Disclaimer**: This system is a decision-support tool intended to assist qualified healthcare professionals. Predictions are NOT medical diagnoses and must NOT replace clinical judgement by licensed practitioners.

---

## Overview
A real-time, modular, production-grade clinical decision-support application that predicts patient risk levels using Machine Learning (SVM, Random Forest, AdaBoost). The system features:
- Real-time risk alerts via WebSockets (Django Channels + Redis)
- Background processing via Celery
- SHAP-based prediction explainability
- Role-based access control (Admin, Doctor, Nurse, Analyst)
- Async report generation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python, Django 5, Django REST Framework |
| Database | Neon PostgreSQL (primary source of truth) |
| Real-time | Django Channels, Redis, WebSockets |
| Background | Celery, Redis broker |
| ML | scikit-learn (SVM, RF, AdaBoost), SHAP, joblib |
| Auth | JWT (djangorestframework-simplejwt) |
| Container | Docker Compose |

## Project Structure

```
4-1/
├── backend/          # Django + DRF + Channels + Celery
├── frontend/         # Next.js 14 + TypeScript + Tailwind
├── ml/               # ML training scripts, datasets, artifacts
├── docker/           # Dockerfiles and nginx config
├── docker-compose.yml
├── .env.example      # Environment variables template
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Neon PostgreSQL account (free tier sufficient for dev)
- Node.js 20+
- Python 3.12+

### 1. Clone and configure environment
```bash
cp .env.example .env
# Edit .env — set your DATABASE_URL (Neon), DJANGO_SECRET_KEY
```

### 2. Start all services
```bash
docker-compose up --build
```

Services:
- Django backend: http://localhost:8000
- Next.js frontend: http://localhost:3000
- Django admin: http://localhost:8000/admin
- API docs (browsable): http://localhost:8000/api/v1/

### 3. Run migrations & create superuser
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 4. (Optional) Train ML models
```bash
docker-compose exec backend python manage.py train_models
```

## Development (without Docker)

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver

# Celery worker (separate terminal)
celery -A config.celery worker -l info

# Celery beat (separate terminal)
celery -A config.celery beat -l info

# Frontend
cd frontend
npm install
npm run dev
```

## Running Tests
```bash
cd backend
pytest --cov=apps --cov=services --cov=repositories -v
```

## API Versioning
All API endpoints are versioned under `/api/v1/`.

## Environment Variables
See `.env.example` for all required and optional environment variables.

---

*Project Code: BPY-CSE-2666 | Application: Patient Risk Level Prediction Using Machine Learning for Intelligent Clinical Decision Support*
