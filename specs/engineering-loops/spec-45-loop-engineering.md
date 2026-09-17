# SPEC-45: Loop Engineering Enterprise Integration

## 1. Overview
Integrates `@cobusgreyling/loop` into the Healthcare CDSS application as an engineering agent loop governance layer.

## 2. Invariants
- Sole authoritative source of truth: Neon PostgreSQL.
- Zero PHI in agent memory.
- Default to `L1_REPORT_ONLY`.
- Isolated worktrees under `worktrees/<run-id>/`.
- Maker / Checker verifier required.
- Hard-stop budget limit and emergency kill-switch.
