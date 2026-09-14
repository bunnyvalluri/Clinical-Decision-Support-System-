# PocketBase Production Deployment & Operational Guidance

## Production Readiness Disclaimer
PocketBase is actively developed and has not reached `v1.0`. Full backward compatibility between minor releases is not guaranteed. 

### Operational Rules in Production
1. **Never Depend on PocketBase for Clinical Workflows**: All patient care, diagnostics, and risk assessments run through Django and Neon PostgreSQL.
2. **Persistent Storage**: Mount a durable block storage volume to `/pb_data` to ensure SQLite durability across container restarts.
3. **Admin Dashboard Hardening**: Block public access to `/_/` at the reverse proxy (Nginx / Cloudflare) and allow access only via VPN / internal subnet.
4. **Automated Health Monitoring**: Probe `/api/health` every 15 seconds. If PocketBase restarts or crashes, alert operations without triggering clinical panic.
5. **Backups**: Run SQLite online backup utilities (`VACUUM INTO '/backups/pb_backup.db'`) daily. Do not assume Neon PostgreSQL backups cover PocketBase.
