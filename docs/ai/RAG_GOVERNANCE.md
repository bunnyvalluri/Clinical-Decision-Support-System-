# RAG Platform Governance & Clinical Grounding

## RAG Lifecycle Architecture

Retrieval-Augmented Generation in healthcare must guarantee verifiable truth, eliminate hallucination, and prevent data leakage across institutional boundaries. The HealthNova RAG Platform enforces a 10-step pipeline:

```
[Clinical Source Document]
          │
          ▼
   1. Malware & Format Scan
          │
          ▼
   2. De-identification & PHI Classification
          │
          ▼
   3. Semantic Chunking (Hierarchical Markdown/Sections)
          │
          ▼
   4. Versioning & Hash Fingerprinting (SHA-256)
          │
          ▼
   5. Embeddings (text-embedding-3-small or Gemini Embedding)
          │
          ▼
   6. Neon PostgreSQL Dual Indexing (pgvector + tsvector)
          │
          ▼
   7. Hybrid Search & Reciprocal Rank Fusion (RRF)
          │
          ▼
   8. Corrective RAG Evaluation (Relevance Grader)
          │
          ▼
   9. Context Minimization & Prompt Assembly
          │
          ▼
  10. Strict Citation Grounding & Verifiable Attribution
```

---

## Approved Clinical Knowledge Sources

Only pre-approved, peer-reviewed clinical guidelines and institutional protocols may be ingested:

1. **Surviving Sepsis Campaign (SSC-2021)**: Sepsis resuscitation, lactate clearance, vasopressor escalation protocols.
2. **KDIGO Clinical Practice Guideline (2012/2024 update)**: Acute Kidney Injury staging, creatinine/urine output thresholds.
3. **AHA/ACC Guideline for Acute Coronary Syndromes (ACS)**: Troponin delta analysis, STEMI/NSTEMI pathways.
4. **GOLD Guidelines (2024)**: Chronic Obstructive Pulmonary Disease exacerbation management.
5. **Hospital Institutional Formulary & Pharmacy Protocols**: Verified drug dosing, renal adjustments, contraindications.

> [!CAUTION]
> Arbitrary web scraping, open forums (Reddit, Quora), and unvetted medical blogs are strictly prohibited from the authoritative clinical knowledge index.

---

## Document Status Lifecycle

Every `KnowledgeDocument` persists in Neon PostgreSQL with a formal review state:
- `DRAFT`: Ingested but unverified; cannot be retrieved in clinical production.
- `UNDER_REVIEW`: Assigned to clinical review board for medical accuracy inspection.
- `APPROVED`: Fully active; indexed in pgvector and accessible for RAG synthesis.
- `EXPIRED`: Superseded by newer institutional or international guidelines.
- `REJECTED`: Found inaccurate or unsafe; quarantined from search.
- `ARCHIVED`: Retained for historical audit trails and retrospective case reviews.

---

## Hybrid Retrieval & Corrective RAG (CRAG)

### 1. Hybrid Search Implementation
Medical queries combine exact identifiers (e.g. `ICD-10 I21.9`, `Lactate > 2.0`) with fuzzy descriptive symptoms (e.g. "sudden tearing substernal chest discomfort"). Relying solely on dense vector search yields low recall on exact codes.
- **Lexical Search**: PostgreSQL native `tsvector` with English dictionary and stemmer.
- **Semantic Vector Search**: Cosine distance using `pgvector` indexing.
- **Reciprocal Rank Fusion (RRF)**:
  $$\text{RRF Score}(d) = \sum_{m \in \{\text{vector}, \text{bm25}\}} \frac{1}{k + \text{rank}_m(d)}$$ (with constant $k=60$).

### 2. Corrective RAG (CRAG) Workflow
- The retrieval grader evaluates whether the top-ranked document chunks sufficiently address the user's clinical query.
- If retrieval confidence falls below 0.70:
  1. The query is re-written using standardized medical terminology (e.g. mapping colloquisms to MeSH terms).
  2. A secondary focused retrieval pass is executed.
  3. If relevance remains below threshold, the system halts with: `INSUFFICIENT_APPROVED_INFORMATION`. Under no circumstances does the system query the public web or hallucinate an ungrounded answer.

---

## Citation & Grounding Standard

Every generated response grounded in clinical literature must return structured citations:
- `guideline_id`: Institutional identifier (e.g. `SSC-2021-REC-04`).
- `title`: Formal guideline title.
- `section`: Specific chapter or section (e.g. `Initial Resuscitation § 3.2`).
- `recommendation`: Exact excerpt or paraphrased rule from the source.
- `evidence_level`: Level of Evidence (e.g. `High-Quality RCT`, `Consensus Opinion`).
- `doi_or_url`: Permanent Digital Object Identifier link.
- `grounding_status`: `GROUNDED` ($\ge 0.85$), `PARTIALLY_GROUNDED` ($0.60 - 0.84$), or `UNSUPPORTED` ($< 0.60$).
