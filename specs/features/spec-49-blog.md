# Spec-49: Production Healthcare AI Blog & Educational Intelligence Platform

**Feature Code:** BLOG-001  
**Target Topology:** Hierarchical Policy Swarm  
**Authoritative Store:** Neon PostgreSQL  
**Search Cache:** Meilisearch v1.12.0 (Auxiliary)  
**Status:** IMPLEMENTED  

---

## 1. Executive Summary & Purpose
The HealthNova AI Blog provides evidence-based, clinician-verified insights into cardiovascular risk stratification, edge wearable telemetry, machine learning explainability (TreeSHAP), and digital health policy. It is strictly classified as an educational and research resource; all published clinical content enforces a non-autonomous advisory standard.

---

## 2. Actors & Permissions
1. **Anonymous / Public User**: Can browse `/blog`, view published articles, filter by categories, use search, and subscribe to research digests.
2. **Patient / Family**: Can read published educational guides and bookmark articles to their personal health portal profile.
3. **Doctor / Nurse**: Can review evidence-based clinical articles and verified trial summaries.
4. **Medical Informaticist**: Can author technical explainability content and review algorithmic model documentation.
5. **IT Administrator**: Manages content lifecycle, database migrations, and operational telemetry.

---

## 3. Data Model Architecture (Neon PostgreSQL)
1. **`BlogCategory`**: Name, unique slug, description, icon name, display order, real article count.
2. **`BlogAuthor`**: Name, clinical role title, bio, avatar, optional foreign key to User.
3. **`BlogArticle`**:
   - `slug` (unique, indexed)
   - `title`, `excerpt`, `content`
   - `category` (FK), `author` (FK), `tags` (JSON)
   - `status`: `DRAFT` | `REVIEW` | `APPROVED` | `PUBLISHED` | `ARCHIVED`
   - `is_featured`: boolean highlight flag
   - `is_guide`: boolean practical guide flag
   - `reading_time_minutes`: derived from content (~200 words/minute)
   - `medical_review_status`: `PENDING` | `VERIFIED` | `NOT_APPLICABLE`
   - `views_count`: integer telemetry
   - SEO metadata: `seo_title`, `seo_description`, `canonical_url`
4. **`BlogArticleBookmark`**: User-specific saved articles with unique `(user, article)` composite index.
5. **`NewsletterSubscriber`**: Unique normalized email address, status, IP address, subscription timestamp.

---

## 4. API Endpoints
- `GET /api/v1/blog/articles/`: Filter by `category`, `q`, `sort`, with server pagination.
- `GET /api/v1/blog/articles/{slug}/`: Full article detail with related articles and view increment.
- `GET /api/v1/blog/featured/`: High-priority featured story.
- `GET /api/v1/blog/guides/`: Top concise guides for the bottom hub.
- `GET /api/v1/blog/categories/`: Dynamic categories with real PostgreSQL published article counts.
- `GET /api/v1/blog/search/`: Full-text search with resilient fallback.
- `POST /api/v1/blog/newsletter/subscribe/`: Rate-limited email intake with duplicate prevention.
- `POST /api/v1/blog/articles/{id}/bookmark/`: Authenticated bookmark toggle.

---

## 5. Clinical Safety & Legal Invariants
- **Non-Autonomous Stance**: Every article displays an advisory disclaimer. Content does not prescribe medication or render formal diagnostic verdicts.
- **Zero Fake Business Data**: Real database counts (`COUNT()`), no fabricated view numbers, and true pagination metadata.
- **White Theme Standard**: Built with a dedicated, hospital-grade white palette (zero `dark:` classes).
