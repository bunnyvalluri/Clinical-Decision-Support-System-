# Agent Memory Isolation & Knowledge Boundaries

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Five Segregated Memory Domains

Agent memory is physically and logically partitioned to prevent cross-contamination:

```
[Agent Memory Store]
       ├── [engineering]          ──> Code patterns, ADRs, refactoring templates
       ├── [agent_coordination]  ──> Swarm task assignments, ephemeral receipts
       ├── [project_knowledge]   ──> System specifications, clinical guidelines index
       ├── [ai_evaluations]      ──> Model validation runs, drift metrics, AUC history
       └── [clinical_guidelines] ──> Grounded medical literature (KDIGO, SSC, AHA)
```

---

## 2. Hard Invariant: No PHI in Memory

- **Strict Prohibition**: No patient names, MRNs, dates of birth, or identifiable clinical notes may ever be written to the agent memory store.
- **Pre-Storage Verification**: Every `memory_store` call passes through a PHI sanitizer regex filter. If potential health identifiers or credit cards/SSNs are detected, the write is aborted and logged as a security violation.
- **Ephemeral Coordination**: Swarm state in `agent_coordination` expires after 14 days; evaluation snapshots expire after 365 days.
