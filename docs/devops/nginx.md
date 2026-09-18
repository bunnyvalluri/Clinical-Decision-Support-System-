# HealthNova AI — Production Nginx Configuration Guide

## 1. Responsibilities
The production Nginx reverse proxy sits at the edge of the HealthNova application network (or behind Traefik in Coolify) with the following responsibilities:
1. **SSL/TLS & HTTPS Redirection**: Redirects insecure HTTP traffic to HTTPS via HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
2. **Reverse Proxy Routing**:
   - `/` → Next.js Node.js Standalone frontend (`frontend:3000`)
   - `/api/` → Django DRF ASGI backend (`backend:8000`)
   - `/admin/` → Django Administration portal (`backend:8000`)
   - `/ws/` → Django Channels WebSocket connection (`backend:8000`)
   - `/static/` & `/media/` → Backend static/media assets with HTTP caching
   - `/healthz` → Direct load balancer health check returning HTTP 200
3. **Security Headers (HIPAA / OWASP / NIST SP 800-53)**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
4. **WebSocket Upgrade**:
   - Forwards `Connection: "upgrade"` and `Upgrade: $http_upgrade`
   - Extended read/send timeouts of 86400s (24 hours) for clinical telemetry streams.
5. **Gzip Compression**: Compresses text, JSON, CSS, JS, and XML payloads dynamically.
6. **Payload Limits**: Enforces `client_max_body_size 25M;` to prevent denial-of-service via large multipart uploads.

## 2. WebSocket Testing Checklist
- **Connect**: Authenticated WebSocket handshake over `/ws/clinical/` or `/ws/notifications/`
- **Ping/Pong**: Keepalive heartbeat ping handled by Daphne ASGI
- **Reconnect**: Automatic retry with exponential backoff on client side
- **Timeout**: Graceful close on connection drop
- **Expired Token**: HTTP 4001 or channel disconnect on invalid JWT
