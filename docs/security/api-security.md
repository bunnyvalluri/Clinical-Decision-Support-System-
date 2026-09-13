# API Security & Hardening

1. **CORS Validation:** Strictly limits cross-origin calls to approved frontends.
2. **CSRF Protection:** Configured with `CSRF_TRUSTED_ORIGINS`.
3. **Rate Limiting:** DRF throttling protects endpoints from brute force:
   - Anon Throttle: 100 requests/day.
   - User Throttle: 1000 requests/hour.
   - Prediction Burst Throttle: 60 requests/minute.
