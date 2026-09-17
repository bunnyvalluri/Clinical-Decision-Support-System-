# Loop Engineering Architecture

## 1. System Topology
The Loop Engineering integration operates asynchronously:
```
Next.js Frontend (Admin UI)
        │
Django REST Framework API
        │
Loop Policy Engine (Default Deny)
        │
Celery Worker Queue ('engineering_loops')
        │
Isolated Git Worktree (worktrees/<run-id>/)
        │
Maker / Checker Verifier
        │
Neon PostgreSQL (Authoritative Audit Store)
```

## 2. Invariants
- **No Direct Production Database Access**: Agents never receive production database credentials.
- **Asynchronous Only**: Never embedded into synchronous HTTP request lifecycles.
- **Zero PHI**: Real patient data cannot enter engineering context.
