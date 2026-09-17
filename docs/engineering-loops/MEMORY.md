# Engineering State & Memory Isolation

## 1. Domain Separation
- **`ENGINEERING_MEMORY`**: Maintained in `STATE.md` and ephemeral worktree logs. Contains loop health, ready scores, and execution summaries.
- **`CLINICAL_AI_MEMORY`**: Clinical patient reasoning and risk factors are stored in Neon PostgreSQL and never cross-pollinate with engineering state.

## 2. Retention & Compaction
`STATE.md` is compacted periodically; obsolete run traces are archived to prevent unbounded growth.
