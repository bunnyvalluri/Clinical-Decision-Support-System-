# Engineering Tool Registry

The `EngineeringToolRegistry` defines allowlisted capabilities:
- `READ_REPOSITORY`: Access repository files (Default L1).
- `READ_GIT`: Inspect Git history, branches, and status (Default L1).
- `WRITE_WORKTREE`: Modify files strictly inside `worktrees/<run-id>/` (L2+ only).
- `RUN_TESTS`: Execute unit and integration tests (L1+).
- `RUN_LINT`: Execute ESLint / Flake8 / Ruff checks (L1+).
- `RUN_TYPECHECK`: Execute TypeScript `tsc --noEmit` and mypy (L1+).
- `RUN_BUILD`: Verify production bundling (L1+).
- `CREATE_PR`: Generate draft PRs with dual-custody approval (L2+).
