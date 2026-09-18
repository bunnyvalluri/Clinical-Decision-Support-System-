# HealthNova AI Platform Infrastructure Overview

## System Architecture

HealthNova AI infrastructure provides an enterprise clinical decision support runtime compliant with HIPAA, HITECH, and SOC 2.

```
                  +----------------------------------------------+
                  |               Internet Clients               |
                  +----------------------------------------------+
                                         |
                                         | HTTPS (TLS 1.3) / Port 443
                                         v
+-----------------------------------------------------------------------------------+
| AWS VPC: 10.0.0.0/16                                                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Public Subnets (10.0.1.0/24, 10.0.2.0/24)                                    |  |
|  | [AWS Application Load Balancer / Traefik Edge Proxy]                        |  |
|  +-----------------------------------------------------------------------------+  |
|         |                                                                         |
|         | Internal Traffic (Port 8000, 3000, 8080)                                |
|         v                                                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Private App Subnets (10.0.10.0/24, 10.0.11.0/24)                             |  |
|  | [Coolify Host VM - c6i.2xlarge]                                             |  |
|  |   ├── Next.js 16.3 Frontend (Port 3000)                                     |  |
|  |   ├── Django ASGI API (Port 8000)                                           |  |
|  |   └── Celery Workers & Beat Scheduler                                      |  |
|  +-----------------------------------------------------------------------------+  |
|         |                                                                         |
|         | Isolated Service Connections                                            |
|         v                                                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Private Data Subnets (10.0.20.0/24, 10.0.21.0/24)                            |  |
|  |   ├── Redis Cache & Channel Layer (Port 6379)                               |  |
|  |   ├── Meilisearch Vector Retrieval (Port 7700)                              |  |
|  |   └── Ollama Clinical LLM Engine (Port 11434)                                |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Encrypted PgBouncer TLS
                                         v
+-----------------------------------------------------------------------------------+
| Authoritative Managed Cloud Services                                              |
|   ├── Neon PostgreSQL Serverless (Endpoint: divine-smoke-01982543, Branch: prod)  |
|   └── AWS S3 Encrypted Object Store (healthnova-production-dr-backups)            |
+-----------------------------------------------------------------------------------+
```

## Key Infrastructure Components

1. **IaC Engine**: OpenTofu v1.8.x with modular topology.
2. **Compute Host**: CIS-hardened Ubuntu 22.04 LTS host with IMDSv2.
3. **Application Layer**: Coolify PaaS running Docker containers with `no-new-privileges: true`.
4. **Primary Store**: Neon PostgreSQL Serverless with automated point-in-time recovery.
5. **Observability**: Prometheus, Grafana, OpenTelemetry, Sentry, and Loki.
