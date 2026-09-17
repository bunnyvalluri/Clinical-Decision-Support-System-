# Coolify Operational Guide — HealthNova AI CDSS

> **Version**: Coolify `v4.0.0-beta.380`  
> **API Version**: `/api/v1`  
> **Target Servers**: Dedicated Linux (Ubuntu 22.04 LTS / Debian 12) with Docker Engine

---

## 1. Installation and Host Setup

Coolify is installed on the dedicated infrastructure control plane host using the official automated installer:

```bash
# Execute on target server as root or sudo user
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Once installed, Coolify binds to port `8000` (internal control plane) and provisions Traefik on ports `80` (HTTP) and `443` (HTTPS).

---

## 2. Server-Side Configuration & Secrets

The Django backend interfaces with Coolify using environment variables defined in `backend/.env`:

```ini
# Coolify Control Plane Integration
COOLIFY_API_URL=http://localhost:8000/api/v1
COOLIFY_API_TOKEN=coolify_bearer_token_here
COOLIFY_DEFAULT_SERVER_UUID=srv-healthnova-prod-01
COOLIFY_WEBHOOK_SECRET=coolify_webhook_signing_secret_here
COOLIFY_TIMEOUT_SECONDS=5
COOLIFY_CIRCUIT_BREAKER_MAX_FAILURES=3
COOLIFY_CIRCUIT_BREAKER_RESET_TIMEOUT=30
```

> [!CAUTION]
> `COOLIFY_API_TOKEN` must **never** be prefixed with `NEXT_PUBLIC_` or exposed to browser bundles. Only Django's server-side integration interacts with the Coolify REST API.

---

## 3. Deployment Topology & Compose Stacks

The deployment manifests reside in the `infra/coolify/` directory:
- `docker-compose.prod.yml`: Production services stack with strict healthchecks, restart policies, resource limits, and TLS routing labels.
- `docker-compose.staging.yml`: Staging stack connected to isolated staging Redis and synthetic database mocks.

---

## 4. API Endpoints Map

| Coolify API Route | HTTP Method | Django Client Method | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/v1/servers` | GET | `client.get_servers()` | List managed infrastructure servers |
| `/api/v1/servers/{uuid}` | GET | `client.get_server(uuid)` | Inspect server hardware & health |
| `/api/v1/applications` | GET | `client.get_applications()` | List deployed application stacks |
| `/api/v1/deploy` | POST | `client.deploy_application(uuid)` | Trigger deployment for application UUID |
| `/api/v1/deployments/{uuid}`| GET | `client.get_deployment(uuid)` | Check deployment status (`RUNNING`, `SUCCESS`) |
| `/api/v1/deployments/{uuid}/logs` | GET | `client.get_deployment_logs(uuid)` | Stream build & deployment logs |
