# Deployment Overview

The **PatientRisk Clinical Decision Support System** is packaged using a containerized microservice architecture connecting to external managed cloud infrastructure.

---

## 1. Production Architecture Principles

- **No PostgreSQL in Docker:** Production database persistence is delegated entirely to **Neon Cloud PostgreSQL**.
- **Non-Root Execution:** Every service runs under dedicated unprivileged system users (`appuser`, `nextjs`).
- **Nginx Ingress:** Terminates SSL/TLS, proxies WebSocket traffic, and caches static assets.
- **Asynchronous Task Workers:** Dedicated Celery worker and scheduler containers offload computational jobs from web threads.
