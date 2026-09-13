# 05. Project Directory Structure

This document provides an exhaustive breakdown of the project directory layout, explaining the purpose of each key file and module.

---

## 1. High-Level Workspace Layout

```
c:-1├── .github/                      # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml             # 7-stage automated CI/CD pipeline
├── backend/                      # Django ASGI REST backend & services
├── frontend/                     # Next.js 16 TypeScript web application
├── ml/                           # Standalone ML training, artifacts, & evaluation
├── docker/                       # Infrastructure configuration (Nginx configs, etc.)
├── docs/                         # Comprehensive engineering documentation
├── scripts/                      # Deployment and maintenance scripts
├── docker-compose.yml            # Multi-container local development orchestration
├── .env.example                  # Sanitized production environment variable template
├── Makefile                      # Common developer command shortcuts
└── README.md                     # Root project overview
```

---

## 2. Backend Layout (`backend/`)

```
backend/
├── manage.py                     # Django CLI administrative entrypoint
├── pytest.ini                    # Pytest test runner configuration
├── requirements.txt              # Production Python dependencies
├── Dockerfile                    # Multi-stage Python 3.13 production container
│
├── config/                       # Core Django project configuration
│   ├── __init__.py
│   ├── asgi.py                   # ASGI application entrypoint (HTTP + WebSockets)
│   ├── wsgi.py                   # WSGI fallback entrypoint
│   ├── celery.py                 # Celery app initialization, base tasks & locks
│   ├── logging.py                # StructuredJsonFormatter for log aggregation
│   └── settings/
│       ├── __init__.py
│       ├── base.py               # Shared settings (apps, middleware, DRF, JWT)
│       ├── development.py        # Local development overrides
│       └── production.py         # Production security & Neon DB configuration
│
├── apps/                         # Modular Django applications
│   ├── accounts/                 # User authentication, User model, JWT views, RBAC
│   ├── patients/                 # Patient demographics master model & views
│   ├── clinical/                 # Serial clinical encounters & vital signs records
│   ├── predictions/              # Prediction model, explainability, REST views
│   ├── model_registry/           # ModelVersion metadata, accuracy tracking, status
│   ├── reports/                  # Report entity, Celery PDF compilation tasks
│   ├── notifications/            # Notification alerts entity & delivery tasks
│   └── core/                     # Base models, middleware, metrics registry
│
├── channels_app/                 # Real-time WebSocket routing & consumers
│   ├── consumers.py              # DashboardConsumer, AlertConsumer, PatientConsumer
│   ├── routing.py                # WebSocket URL route definitions
│   ├── middleware.py             # JWT authentication middleware for WebSocket scopes
│   └── events.py                 # Standardized WebSocket event dataclasses
│
├── celery_tasks/                 # Specialized asynchronous worker modules
│   ├── report_tasks.py           # ReportLab PDF compilation
│   ├── ml_tasks.py               # Bulk inference & periodic model evaluation
│   ├── notification_tasks.py     # Email delivery & multi-channel alerts
│   └── scheduled_tasks.py        # Celery Beat scheduled analytics jobs
│
├── services/                     # Business logic service layer (decoupled from views)
│   ├── prediction_service.py     # Prediction orchestration & event publishing
│   ├── explanation_service.py    # SHAP extraction & clinical factor mapping
│   ├── model_loader.py           # In-memory cached model loading
│   └── risk_engine.py            # OOP clinical threshold scoring & validation
│
├── repositories/                 # Data access layer
│   └── prediction_repository.py  # Abstraction for fetching patient & encounter vitals
│
└── tests/                        # Comprehensive test suite
    ├── test_auth.py              # User registration, login, and JWT tests
    ├── test_patient_management.py# Patient & clinical vitals CRUD tests
    ├── test_predictions.py       # Inference, override, and API tests
    ├── test_ml_pipeline.py       # Preprocessing and model artifact tests
    ├── test_explainable_ml.py    # SHAP stability and factor description tests
    ├── test_websockets.py        # WebSocket channel consumer tests
    ├── test_celery_tasks.py      # Background worker and PDF generation tests
    └── test_e2e_production_flow.py # Complete 15-step production lifecycle test
```

---

## 3. Frontend Layout (`frontend/`)

```
frontend/
├── package.json                  # Dependencies and scripts (dev, build, lint)
├── tsconfig.json                 # Strict TypeScript compiler options
├── next.config.ts                # Next.js configuration (standalone output mode)
├── tailwind.config.ts            # Clinical theme tokens, font families, keyframes
├── Dockerfile                    # Multi-stage Node.js 20 Alpine container
│
├── public/                       # Static public assets
│   ├── logo.png                  # High-resolution PatientRisk brand logo
│   └── icon.png                  # Brand favicon & PWA icon
│
└── src/
    ├── app/                      # Next.js App Router pages
    │   ├── layout.tsx            # Root layout with Geist fonts & SEO metadata
    │   ├── page.tsx              # Public landing page with hero brand emblem
    │   ├── icon.png              # App Router automated favicon
    │   ├── login/page.tsx        # Clinician authentication & 1-click persona demo
    │   ├── register/page.tsx     # Staff registration page
    │   ├── forgot-password/      # Password recovery page
    │   ├── dashboard/page.tsx    # Real-time clinical telemetry command center
    │   ├── patients/             # Patient directory & admission forms
    │   │   ├── page.tsx          # Patient directory table with search & filter
    │   │   └── [id]/page.tsx     # Individual patient longitudinal record
    │   ├── clinical/new/page.tsx # Vital signs & encounter observation form
    │   ├── predictions/          # Risk inference pages
    │   │   ├── page.tsx          # Prediction history table
    │   │   ├── new/page.tsx      # Interactive risk inference submission form
    │   │   └── [id]/page.tsx     # SHAP factor waterfall & clinician override
    │   ├── reports/page.tsx      # Discharge summaries & PDF download center
    │   ├── notifications/page.tsx# Real-time triage alert center
    │   ├── profile/page.tsx      # Clinician profile & institutional credentials
    │   └── admin/models/page.tsx # ML model registry & telemetry management
    │
    ├── components/
    │   ├── layout/
    │   │   └── Shell.tsx         # Primary responsive application shell & sidebar
    │   └── ui/                   # Reusable UI component library
    │       ├── button.tsx        # Styled button with loading spinners
    │       ├── badge.tsx         # Clinical risk badges (LOW, MED, HIGH, CRITICAL)
    │       ├── card.tsx          # Glassmorphism container cards
    │       ├── modal.tsx         # Accessible modal dialogues
    │       ├── table.tsx         # Paginated clinical data tables
    │       ├── select.tsx        # Form select controls
    │       ├── input.tsx         # Form inputs with validation error states
    │       ├── alert.tsx         # Priority alert banners
    │       ├── chart.tsx         # Responsive SVG / Canvas metric charts
    │       ├── loading.tsx       # Skeleton loaders & spinners
    │       ├── errorState.tsx    # Standardized error fallback boundaries
    │       └── emptyState.tsx    # Zero-data clinical placeholders
    │
    ├── features/                 # Domain-specific client logic & state
    │   ├── auth/authStore.ts     # User authentication state & JWT persistence
    │   ├── clinical/clinicalStore.ts # Patient vitals, predictions, & alert state
    │   └── dashboard/            # Specialized dashboard widgets
    │       ├── dashboardMetrics.tsx
    │       ├── liveActivityStream.tsx
    │       └── taskStatusTracker.tsx
    │
    ├── hooks/
    │   └── useWebSocket.ts       # Resilient WebSocket hook with exponential backoff
    │
    ├── lib/
    │   ├── api.ts                # Axios instance with auto-refresh interceptors
    │   ├── constants.ts          # Brand constants, API endpoints, risk colors
    │   └── utils.ts              # Class merging (`cn`), formatting helpers
    │
    └── types/
        └── index.ts              # Universal TypeScript clinical domain interfaces
```

---

## 4. Machine Learning Layout (`ml/`)

```
ml/
├── data/                         # Clinical datasets (UCI Heart Disease cohort)
│   └── raw/heart.csv             # 303 patient baseline records
├── preprocessing/                # Data cleaning & transformer pipelines
│   └── preprocessor.py           # Imputation, scaling, and categorical encoders
├── features/                     # Feature extraction & interaction terms
│   └── feature_engineering.py    # Cardiovascular risk factor derivation
├── training/                     # Model training scripts
│   ├── train_svm.py              # Support Vector Machine training
│   ├── train_random_forest.py    # Random Forest ensemble training
│   └── train_adaboost.py         # AdaBoost training
├── evaluation/                   # Model validation & benchmarking
│   └── evaluate.py               # ROC-AUC, Brier score, and confusion matrices
├── explainability/               # SHAP interpretation module
│   └── explainer.py              # TreeExplainer & natural language descriptions
├── inference/                    # Inference utilities
│   └── predict.py                # Standalone inference runner
├── registry/                     # Model registry metadata & artifact hashing
└── artifacts/models/             # Persisted joblib pipeline artifacts
    └── random_forest_risk_model/
        └── 1.0.0/pipeline.joblib # Active production model bundle
```
