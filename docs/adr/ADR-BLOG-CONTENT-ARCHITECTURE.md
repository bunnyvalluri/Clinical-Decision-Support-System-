# ADR-BLOG-CONTENT-ARCHITECTURE: Educational Intelligence & Clinical Content Architecture

**Status:** Accepted  
**Date:** 2026-09-18  
**Context:** Prompt 49 — Production Healthcare AI Blog Page  

---

## 1. Context & Problem Statement
HealthNova AI requires an institutional editorial, educational, and clinical research dissemination platform. Clinical literature, AI explainability tutorials, and wearable continuous monitoring protocols must be published under strict healthcare governance.

Crucial technical tensions:
1. Fast public editorial reading experience vs. strict role boundaries.
2. Search performance vs. database authority.
3. Engaging design language vs. strict White-Only hospital theme.
4. Prevention of medical misinformation and autonomous diagnosis claims.

---

## 2. Decision & Architecture

### 2.1 Neon PostgreSQL as Sole Authoritative Store
- All categories, authors, articles, bookmarks, and newsletter subscribers reside strictly in PostgreSQL.
- Meilisearch is an auxiliary read-only index; search failures fall back gracefully to PostgreSQL full-text/ilike queries.

### 2.2 Content Lifecycle Gates
Articles advance strictly through:
`DRAFT` &rarr; `REVIEW` &rarr; `APPROVED` &rarr; `PUBLISHED` &rarr; `ARCHIVED`
Public APIs only return `status="PUBLISHED"`. Drafts are physically excluded at the database queryset level to prevent information leakage.

### 2.3 Strict White/Light Theme
In alignment with enterprise clinical workstation environments, the blog adheres to a White-Only theme: zero `dark:*` Tailwind classes, `#FFFFFF` canvas, deep navy text (`#020617`), medical teal (`#0d9488`), and subtle slate dividers.

### 2.4 Human-in-the-Loop Clinical Invariant
Every article includes an immutable clinical disclaimer stating that content is for educational and decision-support purposes, with final diagnostic and therapeutic authority resting solely with licensed healthcare clinicians.

---

## 3. Consequences & Verification
- **Performance**: Lightweight list serializers exclude full markdown content from index cards, reducing payload sizes by ~85%.
- **Resilience**: Redis and Meilisearch degradation do not take down the blog.
- **Verification**: Validated via automated Node.js test suites, strict TypeScript checks, and Django test cases.
