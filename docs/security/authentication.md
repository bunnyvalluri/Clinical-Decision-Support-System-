# Authentication System

Authentication utilizes dual-token JSON Web Tokens (JWT) implemented via `djangorestframework-simplejwt`.

---

## 1. Token Lifecycles

- **Access Token:** 15-minute validity window. Contains user ID, email, role, and permissions.
- **Refresh Token:** 7-day validity window. Used to renew expired access tokens via `POST /api/v1/auth/token/refresh/`.
- **Token Blacklisting [PLANNED]:** Redis-backed blacklist to immediately invalidate tokens upon user logout.
