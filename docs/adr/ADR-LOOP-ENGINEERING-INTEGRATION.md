# ADR: Integration of Cobus Greyling Loop Engineering

## Status
Accepted

## Context
Engineering tasks (CI sweeping, dependency review, code health diagnostics, and spec convergence) require automation without granting autonomous agents write access to clinical models, patient records, or production database credentials.

## Decision
1. Integrate `cobusgreyling/loop-engineering` (`@cobusgreyling/loop`) as a controlled background engineering governance layer.
2. Default all loops to `L1_REPORT_ONLY`. L2 and L3 require explicit human gates.
3. Isolate all execution in temporary Git worktrees (`worktrees/<run-id>/`).
4. Shield production databases, secrets, and clinical reasoning paths with a strict path denylist.
5. Provide budget enforcement and emergency kill-switch (`ENGINEERING_LOOPS_ENABLED=false`).

## Consequences
- Enables automated repository maintenance and CI diagnosis.
- Preserves absolute clinical safety and data confidentiality.
