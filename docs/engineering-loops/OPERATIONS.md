# Loop Engineering Operations Guide

## 1. Triggering Loops via CLI
```bash
# Evaluate loop readiness
loop doctor

# Audit loop governance
loop audit

# Sync loop state with definition
loop sync

# Estimate cost
loop cost --pattern DAILY_TRIAGE
```

## 2. Managing Background Workers
Loop tasks execute on the `engineering_loops` queue:
```bash
celery -A config worker -Q engineering_loops -l info
```
