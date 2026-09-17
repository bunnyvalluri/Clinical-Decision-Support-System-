# Loop Engineering Troubleshooting

## 1. Loop Run Fails with `ProtectedPathViolationError`
- **Cause**: An agent attempted to modify a path in the denylist (`.env`, `clinical/`, `model_registry/`).
- **Fix**: Review task scope or adjust autonomy levels. Clinical paths require manual modification.

## 2. Loop Run Fails with `BudgetExceededError`
- **Cause**: The loop's estimated or actual cost exceeded `EngineeringLoopBudget`.
- **Fix**: Increase budget in `/admin/engineering/budgets` or optimize prompt token usage.

## 3. Worktree Unclean
- **Cause**: Previous task crashed before running `WorktreeManager.cleanup_worktree()`.
- **Fix**: Run `celery -A config call apps.engineering_loops.tasks.cleanup_loop_workspace --args='["<run-id>"]'`.
