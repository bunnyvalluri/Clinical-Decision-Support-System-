# Authentication API

Endpoints for user registration, JWT token acquisition, refresh, and logout.

---

## 1. Endpoints

### 1.1 `POST /api/v1/auth/register/`
Registers a new clinical user.
- **Request Body:**
  ```json
  {
    "email": "dr.elena@hospital.org",
    "username": "dr_elena",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "Elena",
    "last_name": "Vance",
    "role": "DOCTOR",
    "department": "Cardiology",
    "phone_number": "+15551234"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "dr.elena@hospital.org", "role": "DOCTOR" },
      "tokens": { "access": "jwt...", "refresh": "jwt..." }
    }
  }
  ```

### 1.2 `POST /api/v1/auth/login/` (or `POST /api/v1/auth/token/`)
Authenticates existing clinician.
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response (200 OK):** `{ "success": true, "data": { "access": "...", "refresh": "..." } }`

### 1.3 `POST /api/v1/auth/token/refresh/`
Rotates access token using a valid refresh token.
