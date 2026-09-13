# GitHub Actions CI/CD Pipeline

Continuous Integration and Deployment is defined in `.github/workflows/ci-cd.yml`.

---

## 1. Pipeline Stages

1. **`lint`**: Flake8, Ruff, ESLint.
2. **`type-check`**: Mypy backend, TypeScript `tsc --noEmit`.
3. **`frontend-tests`**: Next.js production build validation.
4. **`backend-tests`**: Pytest REST API and RBAC test suite.
5. **`ml-tests`**: Inference accuracy, bounds, and SHAP tests.
6. **`build`**: Docker image compilation.
7. **`deployment-readiness`**: Django deployment check (`python manage.py check --deploy`).
