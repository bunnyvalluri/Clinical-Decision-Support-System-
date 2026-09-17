# Security Safeguards & Kill Switch

## 1. Emergency Kill-Switch
Set environment variable or admin toggle:
```env
ENGINEERING_LOOPS_ENABLED=false
```
When false, Celery tasks abort execution immediately and queue dispatch is blocked.

## 2. Path Denylist
Blocks mutation of sensitive paths:
- `.env*`
- `secrets/`
- `backend/apps/clinical/`
- `backend/apps/patients/`
- `backend/apps/predictions/`
- `backend/apps/model_registry/`

## 3. Worktree Isolation
All agent modifications execute inside temporary Git worktrees: `worktrees/<run-id>/`. The primary checkout and uncommitted human work are protected.
