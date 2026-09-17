# Firecrawl Operational Troubleshooting & Incident Response

## 1. Quick Diagnostic Checklist

1. **Is Firecrawl enabled?**
   Check `GET /api/v1/web/admin/health/` as IT Admin. If `enabled: false`, verify `FIRECRAWL_ENABLED=true` in backend environment.

2. **Is Circuit Breaker Open?**
   If upstream Firecrawl experiences 5 consecutive failures, the circuit breaker enters `OPEN` state.
   - It will automatically transition to `HALF_OPEN` after 60 seconds.
   - An IT Admin can force-reset the breaker via the Admin Telemetry UI or restarting the worker.

3. **Are Celery Crawl Jobs Stuck in QUEUED?**
   Verify Celery worker processes are active:
   ```bash
   celery -A config inspect ping
   ```
   Ensure Redis connection string `CELERY_BROKER_URL` is reachable.

4. **Is a Specific Domain Blocked?**
   Inspect `DomainPolicy` table in Neon PostgreSQL or view `/admin/web-intelligence/sources/`. Domains listed with `BLOCKED` status will immediately reject scraping requests.

5. **SSRF Rejections Occurring?**
   Check Django logs for `SSRFBlockedError`. Ensure external targets are fully qualified domain names (FQDNs) and do not resolve to loopback, link-local, or private RFC1918 subnets.
