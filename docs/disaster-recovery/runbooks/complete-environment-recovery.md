# Runbook 12: Complete Environment Reconstruction (Bare-Metal / New VM)

## 1. Symptoms
- Total loss of primary host VM, hosting provider physical datacenter outage, or catastrophic infrastructure failure.

## 2. Detection
- Host completely unreachable via SSH, ping, and cloud control plane.
- PagerDuty SEV1 Critical disaster alert.

## 3. Preconditions
- Clean Linux VM (Ubuntu 22.04 LTS / Debian 12) provisioned on secondary provider/region.
- Access to authoritative Neon PostgreSQL database (intact on AWS us-east-2).
- Access to audited Git repository and encrypted secrets vault.

## 4. Authorization
- CTO, CISO, and Disaster Recovery Incident Commander.

## 5. Step-by-Step Execution
1. **Prepare Host Environment**:
   ```bash
   sudo apt-get update && sudo apt-get install -y git curl docker.io docker-compose-v2
   sudo systemctl enable --now docker
   ```
2. **Clone Audited Release Commit**:
   ```bash
   git clone https://github.com/bunnyvalluri/Clinical-Decision-Support-System-.git cdss
   cd cdss
   git checkout <AUDITED_RELEASE_COMMIT_SHA>
   ```
3. **Inject Production Secrets**:
   Pull production secrets from vault or inject `.env` (strictly never stored in Git):
   ```bash
   # Injected from secure secrets store
   chmod 600 backend/.env
   ```
4. **Verify Database Connectivity**:
   Confirm Neon PostgreSQL connection and point-in-time state:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements/production.txt
   python backend/manage.py check --database default
   ```
5. **Launch Application Stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
6. **Rebuild Derived State**:
   Rebuild Meilisearch search indexes and warm Redis cache:
   ```bash
   docker compose exec backend python manage.py rebuild_search_indexes --all
   ```
7. **Execute 14-Point Restoration Verification Engine**:
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/infrastructure/dr/drill/ | jq .
   ```
8. **Cut Over Public Traffic**:
   Update DNS CNAME / A records to point to new VM IP.

## 6. Validation
- All 14 points in the Restoration Verification Checklist return `VERIFIED`.
- Bedside clinician logins succeed.
- Clinical records, predictions, and audit ledgers accessible.

## 7. Rollback
- In bare-metal reconstruction, rollback means fixing VM provisioning scripts or switching back to primary VM if it recovers.

## 8. Escalation Path
- Incident Commander -> Executive Leadership.

## 9. Post-Recovery Monitoring
- 24-hour continuous SRE war room monitoring.
- Document postmortem with exact timeline and RTO/RPO delta.
