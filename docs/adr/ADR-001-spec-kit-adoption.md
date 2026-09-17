# ADR-001: Adoption of GitHub Spec Kit for Engineering Governance

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Principal Software Architect, Staff Full-Stack Engineer, Healthcare Software Architect, Clinical Informatics Lead  

---

## Context and Problem Statement
The Clinical Decision Support System (CDSS) is a mission-critical healthcare application combining complex real-time WebSockets, machine learning risk models, AI reasoning agents, and relational medical data. As development scales across AI coding agents (Ruflo, Cline) and multi-disciplinary teams, relying on unstructured, ad-hoc chat prompts ("vibe coding") risks requirements drift, unverified clinical assumptions, safety regressions, and security vulnerabilities.

We require a rigorous, specification-driven development framework that anchors development to formal written specifications without turning the governance tool into a runtime clinical dependency.

---

## Decision Drivers
- Need for explicit, traceable requirements before code changes.
- Mandatory clinical safety invariants (no autonomous diagnoses or prescriptions).
- Zero runtime performance overhead or runtime clinical dependencies.
- Seamless compatibility with existing tech stack (Next.js, Django, Neon PostgreSQL, Celery, Channels, scikit-learn, Ollama, Ruflo, Cline).

---

## Considered Options
1. **GitHub Spec Kit (`github/spec-kit`)**: Official spec-driven development toolkit establishing Constitution, Specifications, Plans, Tasks, Implementation, and Convergence.
2. **Ad-hoc Markdown in `docs/`**: Unstructured documentation without standardized lifecycle or automated validation.
3. **Runtime Governance Middleware**: Heavyweight runtime proxy intercepting API calls (rejected: adds runtime latency and failure modes).

---

## Decision Outcome
Adopt **GitHub Spec Kit** (`specify-cli v1.0.8.dev0`) as the system's authoritative **engineering governance and specification framework**.

### Key Rules:
1. **Zero Runtime Footprint**: Spec Kit exists exclusively in the developer lifecycle (`.specify/`, `specs/`). It is **NEVER** imported into runtime production containers, APIs, or prediction pipelines.
2. **Brownfield Integration**: Integrate into the existing codebase without overwriting established architecture, agent configurations (`.ruflo/`, `.clinerules/`), or Next.js/Django applications.
3. **Mandatory Lifecycle**: Major changes must follow:
   $$\text{Constitution} \to \text{Specify} \to \text{Plan} \to \text{Tasks} \to \text{Implement} \to \text{Test} \to \text{Converge}$$

---

## Consequences
- **Positive**: Eliminates requirements ambiguity, prevents metric fabrication, guarantees clinical safety reviews, and ensures documentation stays synchronized with code.
- **Negative**: Adds formal planning overhead for Level 2-4 changes (mitigated by streamlined Level 0-1 pathways for documentation and minor UI tweaks).
