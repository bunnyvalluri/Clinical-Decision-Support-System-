# HealthNova AI CDSS — Controlled Failover Architecture & Runbook

## 1. Failover Strategy

HealthNova AI employs a **Controlled Tiered Failover** model. Because Neon Serverless PostgreSQL decouples compute instances from durable multi-AZ storage, hardware failure on the PostgreSQL compute node triggers automatic instant compute reprovisioning (< 30 seconds) without manual failovers or split-brain risks.

Application-level failovers (e.g. host VM failure or network partition) follow this structured pattern:

```
[ PRIMARY COMPUTE HOST ]                                 [ STANDBY COMPUTE HOST ]
(Coolify / Docker / Nginx)                               (Standby Environment)
          │                                                        │
          │ (Health Probes Fail: 3 Consecutive 5xx)                │
          ▼                                                        ▼
[ Traffic Drain / DNS Cutover ] ──────────────────────────> [ Standby Takes Traffic ]
                                                                   │
                                                      [ Reconnect to Neon Postgres ]
                                                                   │
                                                      [ 14-Point Health Verification ]
```

---

## 2. Production Failover Preconditions & Authorization

> [!CAUTION]
> **Production Safety Invariant**:
> Failover operations must **NEVER** be initiated without explicit authorization from the On-Call SRE Incident Commander and Clinical Informaticist Lead. Never randomly terminate production clinical services during routine hours.

### Mandatory Preconditions:
1. Active SEV1 incident ticket logged with Correlation ID.
2. Verified that primary host is genuinely unresponsive or partitioned.
3. Standby container images verified against target Git commit SHA or digest.
4. Standby secrets and environment variables verified against secure key store.
5. Confirmation that database compute instance is healthy.

---

## 3. Step-by-Step Failover Execution

### Step 1: Halt Primary Traffic Routing
Update Nginx reverse proxy or cloud DNS (Cloudflare / Route53) to temporarily route traffic to maintenance holding page:
```bash
# Shift DNS weight to Standby Endpoint
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-failover-switch.json
```

### Step 2: Verify Standby Stack Health
Check container initialization on the secondary host:
```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://localhost:8000/api/v1/infrastructure/health/ | jq .
```

### Step 3: Verify Database Connection Pool
Ensure standby backend connects cleanly to Neon Serverless PostgreSQL:
```bash
python manage.py check --database default
```

### Step 4: Route Live Bedside Traffic to Standby
Switch Nginx upstream to point to the active standby host port.

### Step 5: Execute 14-Point Diagnostic Verification Probe
Trigger `/api/v1/infrastructure/dr/drill/` to verify all 14 criteria pass.

### Step 6: Post-Failover Monitoring
Monitor error rate, p95 latency, and Celery queue backlog for 60 minutes.
