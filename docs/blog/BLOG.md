# HealthNova AI — Educational & Clinical Intelligence Blog Platform

## Overview
The HealthNova AI Blog provides evidence-based clinical articles, wearable monitoring breakdowns, and machine learning explainability guides.

---

## Directory Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── blog/
│   │   │   ├── page.tsx          # Main editorial index
│   │   │   └── [slug]/page.tsx   # Dynamic article detail
│   ├── features/
│   │   └── blog/
│   │       ├── components/       # Hero, Categories, Cards, Guides, Newsletter, Topic Hub
│   │       ├── services/         # API fetchers with resilient fallbacks
│   │       └── types/            # Strict TypeScript interfaces
backend/
├── apps/
│   └── blog/
│       ├── models.py             # Neon PostgreSQL schema
│       ├── serializers.py        # Card summary and full detail serializers
│       ├── services.py           # Business layer with search fallback
│       ├── views.py              # Public & authenticated DRF views
│       ├── urls.py               # Versioned /api/v1/blog/ routes
│       └── management/commands/  # seed_blog command
```

---

## Key Features & Endpoints
1. **Listing & Categorization**: `GET /api/v1/blog/articles/?category={slug}&q={search}&page={page}`
2. **Featured Highlight**: `GET /api/v1/blog/featured/`
3. **Popular Guides**: `GET /api/v1/blog/guides/`
4. **Dynamic Topics**: `GET /api/v1/blog/categories/`
5. **Fast Search**: `GET /api/v1/blog/search/?q={query}`
6. **Newsletter Intake**: `POST /api/v1/blog/newsletter/subscribe/`
7. **Reading Lists**: `POST /api/v1/blog/articles/{id}/bookmark/`

---

## Operational Commands
```bash
# Seed initial educational articles (development only)
python manage.py seed_blog

# Run automated frontend test suite
node --test tests/blogPage.test.mjs

# Strict TypeScript verification
npx tsc --noEmit
```
