# ADR-003: AI Coding-Agent Governance & Role Separation

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Principal AI Architect, DevSecOps Lead, Senior Security Engineer  

---

## Context
AI coding agents (such as Ruflo multi-agent swarms, Cline, and Antigravity) are utilized across engineering workflows. Without explicit governance, coding agents might:
- Invent fictitious APIs or database models.
- Fabricate ML metrics (e.g. false ROC-AUC values).
- Bypass authentication or object-level authorization checks.
- Inject unredacted PHI into prompts or transcripts.
- Suppress TypeScript errors using `any` or `@ts-ignore` to artificially pass builds.

---

## Decision
Establish constitutional AI Agent Governance:
1. **Separation of Concerns**:
   - **Spec Kit**: Defines **WHAT** must be built (spec, plan, tasks).
   - **Ruflo**: Orchestrates **WHO** performs the work across specialized roles (`requirements-agent`, `ml-engineer-agent`, `clinical-safety-agent`, `security-agent`, `convergence-reviewer`).
   - **Cline / Antigravity**: Executes **HOW** approved tasks are implemented in code.
2. **Strict Prohibitions**:
   - Agents **MUST NOT** invent requirements, database fields, or clinical data.
   - Agents **MUST NOT** disable security checks or suppress TypeScript errors.
   - Agents **MUST NOT** operate with root shell access or raw production database privileges.
3. **Mandatory Human Gates**:
   - Production database migrations, clinical risk logic updates, model promotions, and secret rotations require mandatory human review.

---

## Consequences
- AI agents operate as controlled, policy-governed contributors under multi-layered supervision.
