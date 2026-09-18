# Network Architecture & Security Groups

## IP Allocation & Subnetting

| Subnet Name | CIDR Block | Route Table | Target Workloads |
|---|---|---|---|
| `public-1a` | `10.0.1.0/24` | Internet Gateway | ALB, Reverse Proxy |
| `public-1b` | `10.0.2.0/24` | Internet Gateway | ALB Ingress AZ-b |
| `app-1a` | `10.0.10.0/24` | NAT Gateway | Coolify Host, ASGI API |
| `app-1b` | `10.0.11.0/24` | NAT Gateway | App Redundancy AZ-b |
| `data-1a` | `10.0.20.0/24` | Isolated (No IGW/NAT) | Redis, Meilisearch, Ollama |
| `data-1b` | `10.0.21.0/24` | Isolated (No IGW/NAT) | Data Redundancy AZ-b |

## Ingress Rules & Security Group Matrix

- **ALB Security Group (`alb-sg`)**:
  - Ingress: 80/tcp from `0.0.0.0/0` (Redirect 301 to 443)
  - Ingress: 443/tcp from `0.0.0.0/0` (TLS 1.3)
- **App Security Group (`app-sg`)**:
  - Ingress: 8000/tcp from `alb-sg` only
  - Ingress: 3000/tcp from `alb-sg` only
  - Ingress: 8080/tcp from `alb-sg` only
  - Ingress: 22/tcp from authorized hospital VPN CIDR only
- **Data Security Group (`data-sg`)**:
  - Ingress: 6379/tcp (Redis) from `app-sg` only
  - Ingress: 7700/tcp (Meilisearch) from `app-sg` only
  - Ingress: 11434/tcp (Ollama) from `app-sg` only
  - Egress: Restricted to VPC local CIDR.
