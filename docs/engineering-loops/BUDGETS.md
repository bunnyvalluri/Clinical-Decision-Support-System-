# Budget & Spend Control

`EngineeringLoopBudget` controls token and dollar spend:
- `daily_limit`: Maximum spend allowed per 24-hour cycle.
- `weekly_limit`: Weekly ceiling.
- `per_run_limit`: Maximum cost per single loop invocation.
- `hard_stop`: If true, execution halts immediately when spend thresholds are reached, transitioning the run to `FAILED` with `BudgetExceededError`.
