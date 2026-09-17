# HealthNova AI — About Page Documentation

> **Page Route:** `/about`  
> **Classification:** Public Informational & Clinical Decision Support Context  
> **Design Theme:** Pure White / Light Mode (`#ffffff`, Slate borders, Teal accents)  
> **Authoritative Persistence:** Neon PostgreSQL (backend unchanged)  
> **Academic Project Lineage:** `BPY-CSE-2666`

---

## 1. Purpose & Clinical Positioning

The `/about` page presents the institutional vision, technical architecture, and ethical commitments of the clinical decision support platform:

- **Primary Mission:** Enhance clinical decision support systems through patient risk level prediction using validated machine learning techniques.
- **Core Positioning:** AI/ML provides assistive risk prediction and localized TreeSHAP feature attributions.
- **MANDATORY INVARIANT:** The system **never** issues autonomous medical diagnoses or final prescriptions. Licensed human healthcare professionals retain sole diagnostic and therapeutic authority.
- **Zero Fabricated Data:** Adheres strictly to the repository's rule against fake statistics, fake hospital partners, or unvalidated clinical outcome claims.

---

## 2. Component Architecture

All components reside in `frontend/src/components/about/` and are composed inside the Server Component `frontend/src/app/about/page.tsx`:

```
frontend/src/
├── app/
│   └── about/
│       └── page.tsx                      # Server Component with complete SEO metadata
└── components/
    ├── layout/
    │   ├── PublicNavbar.tsx              # Universal public top navigation & mobile drawer
    │   └── PublicFooter.tsx              # Universal public footer & safety notice
    └── about/
        ├── AboutHero.tsx                 # Eyebrow, 2-line title, interactive intelligence node visual
        ├── FoundationSection.tsx         # Vision, Mission, Purpose cards in rounded container
        ├── DifferenceSection.tsx         # 6 core capabilities & bedside clinical tablet mockup
        ├── PrinciplesSection.tsx         # 6 Guiding Principle cards (People First, Responsibility, etc.)
        ├── ResponsibleAISection.tsx      # 4 Safety Pillars + Institutional Clinical Disclaimer
        ├── TechnologyFoundation.tsx      # 8-tier stack (Neon, Django, Celery, Redis, scikit-learn, etc.)
        ├── JourneyTimeline.tsx           # 5-stage research timeline (horizontal desktop, vertical mobile)
        ├── ClinicalWorkflow.tsx          # 7-step intelligence pathway ending in Human Clinician Decision
        ├── AboutFAQ.tsx                  # Accessible shadcn/ui Accordion answering 8 key questions
        ├── AboutCTA.tsx                  # Pre-footer call to action for institutional adoption
        └── index.ts                      # Barrel export
```

---

## 3. Section Overview

| Section | Eyebrow / Heading | Key Technical & Clinical Details |
| :--- | :--- | :--- |
| **Hero** | `ABOUT OUR PLATFORM` / `Building the Future of Intelligent Clinical Decision Support` | Highlights ML, clinical vitals, and real-time telemetry. Features a radial SVG/CSS network visual with a central "Clinical Intelligence" node and 6 connected concepts. |
| **Foundation** | `OUR FOUNDATION` / `Bridging the Gap Between Data, Intelligence & Clinical Care` | 3 cards: Vision, Mission, and Purpose in a large rounded container (`rounded-3xl bg-slate-50/70`). |
| **Difference** | `WHAT MAKES US DIFFERENT` / `Intelligence. Integration. Clinical Impact.` | 6 feature cards and an interactive clinical tablet dashboard visualization displaying calibrated risk tier, TreeSHAP attributions, and clinician sign-off. |
| **Principles** | `OUR GUIDING PRINCIPLES` / `The Principles That Guide Everything We Do` | 6 cards: People First, Clinical Responsibility, Transparency, Privacy & Security, Innovation, Continuous Improvement. |
| **Responsible AI** | `CLINICAL SAFETY INVARIANTS` / `Responsible Intelligence by Design` | 4 pillars: Human Oversight, Explainability, Privacy & Security, Continuous Evaluation. Includes mandatory non-autonomous diagnosis disclaimer. |
| **Technology** | `OUR TECHNOLOGY FOUNDATION` / `Built for Modern Clinical Intelligence` | Full stack layout: Neon PostgreSQL, Django/DRF, Django Channels & Redis, scikit-learn & TreeSHAP, AI Gateway & Ollama, Meilisearch, Celery, Next.js & React 19. |
| **Journey** | `OUR JOURNEY` / `From Data to Meaningful Clinical Intelligence` | 5-stage research progression. Responsive layout: horizontal connected timeline on desktop, vertical timeline on mobile. |
| **Workflow** | `INTELLIGENCE PATHWAY` / `How Clinical Intelligence Comes Together` | 7-step care pathway: Patient Data &rarr; Data Validation &rarr; ML Model &rarr; Risk Prediction &rarr; Explainability &rarr; Clinical Review &rarr; Human Decision. |
| **FAQ** | `KNOWLEDGE BASE` / `Frequently Asked Questions` | Accessible Radix UI / shadcn Accordion answering 8 clinical, ML, and privacy questions. |
| **Final CTA** | `CLINICAL ADOPTION` / `Building Smarter, Safer Clinical Intelligence Together` | Links to `/#features` and institutional contact email. |

---

## 4. Design System & Tokens

The About page enforces a strict **White-Only / Light Theme**:
- **Backgrounds:** `#ffffff`, `bg-slate-50/70`, `bg-teal-50`
- **Text:** Slate-950 (headers), Slate-600 (body), Slate-400 (captions), Teal-700 (accents)
- **Borders:** `border-slate-200`, `border-teal-200`
- **Invariants:** Zero `dark:` classes anywhere in `src/components/about` or `src/app/about`. Verified by automated test suites.

---

## 5. Accessibility & SEO Standards

- **WCAG 2.2 AA Compliance:**
  - Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
  - Single `<h1>` tag located in `AboutHero`.
  - Accessible accordion using Radix UI primitives with keyboard navigation (`Enter`, `Space`, `ArrowUp`, `ArrowDown`).
  - Contrast ratios exceeding 4.5:1 for all textual content.
- **Search Engine Optimization:**
  - Title: `About | Intelligent Clinical Decision Support`
  - Meta description, canonical link (`/about`), OpenGraph tags, and Twitter Cards pre-rendered via Next.js Server Component.

---

## 6. Verification & Automated Tests

A dedicated test suite `frontend/tests/aboutPage.test.mjs` runs with Node.js test runner:
```bash
npm run test:about
# or all tests
npm run test
```
Verifies:
1. Route presence and SEO metadata schema.
2. All 10 section components exist and export properly.
3. Mandatory clinical disclaimer invariants (non-autonomous diagnosis).
4. Strict white-only theme policy (0 dark-mode classes).
5. Public navigation and footer link integrity.
