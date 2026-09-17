# ADR-002: Brownfield Spec-Driven Development Workflow

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Principal Architect, Staff Full-Stack Engineer, Lead DevOps Engineer  

---

## Context
The healthcare CDSS is an active, production-oriented brownfield codebase with existing Next.js frontend, Django REST backend, Celery workers, and Neon PostgreSQL database. Blindly running destructive scaffolding commands (such as `specify init` without inspection) could overwrite existing agent configurations (`AGENTS.md`, `.ruflo/`, `.clinerules/`), documentation, or CI pipelines.

---

## Decision
1. Implement a **non-destructive brownfield integration approach**:
   - Install Spec Kit CLI via `uv tool install` pinned to official GitHub repository.
   - Scaffold templates, workflows, and constitution in `.specify/` without overwriting existing workspace configurations.
   - Dual-register coding agent integrations for both **Antigravity (`agy`)** and **Cline (`cline`)** within `.specify/integration.json`.
   - Preserve all 7 existing Neon developer skills in `.agents/skills/` while adding the 10 Spec Kit skills (`speckit-constitution`, `speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-implement`, `speckit-converge`, `speckit-analyze`, `speckit-checklist`, `speckit-clarify`, `speckit-taskstoissues`).
2. Classify development changes into 5 formal levels:
   - **Level 0**: Documentation only (no spec required).
   - **Level 1**: Minor UI / Cosmetic (light-theme only; PR + lint).
   - **Level 2**: Normal feature / bug fix (full SDD cycle).
   - **Level 3**: Architectural / Data schema change (ADR + full SDD cycle).
   - **Level 4**: Clinical / ML / AI / Security Critical (ADR + full SDD cycle + Clinical Safety Agent audit + Human sign-off).

---

## Consequences
- Protects existing production assets from unintended overwrites while unlocking structured specification-driven development for all future enhancements.
