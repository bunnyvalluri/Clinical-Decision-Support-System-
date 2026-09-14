# CDSS Multi-Role Authorization & Security Architecture

## Authentication vs. Authorization

The application maintains strict architectural separation between **Authentication** and **Authorization**:

| Layer | Responsibility | Failure Action |
| :--- | :--- | :--- |
| **Authentication** | Verifying user identity via JWT tokens | Unauthenticated → Redirect to `/login` |
| **Frontend Route Authorization** | Ensuring users only see pages tailored to their role | Cross-role mismatch → Redirect to user's authorized role dashboard |
| **Backend API Authorization** | Authoritative RBAC gate on Django REST Framework endpoints | Unauthorized request → Return HTTP `403 Forbidden` JSON response |
| **Real-time WebSocket RBAC** | Authoritative gate on Django Channels consumers | Unauthorized subscription → Terminate socket with close code `4003` |

---

## Why Frontend Access Denied Pages Are Eliminated

In multi-role clinical software, showing a technical "Access Denied" or 403 page for routine navigation mismatches degrades clinician workflows and user experience:
1. **Accidental Clicks & Stale Links**: When clinicians receive shared links or accidentally type a URL, they should be seamlessly brought to their active work environment rather than confronted with an alarming security screen.
2. **Information Disclosure Prevention**: Displaying details such as "Requested /nurse/dashboard, Your Role DOCTOR, Required Role NURSE" exposes system routing topology unnecessarily.
3. **Seamless Redirection**: The user simply arrives at `/doctor/dashboard` immediately.

---

## Backend Authorization as the Definitive Security Boundary

Frontend routing guards provide UX isolation and flow convenience. **They are NOT the security boundary.**
The backend Django/DRF service strictly enforces security:
- Every API endpoint requires JWT Bearer Authentication and checks role permissions via Django permission classes (`IsDoctorOrReadOnly`, `IsAdminUser`, `IsClinicalStaff`, etc.).
- Even if a client bypasses frontend routing and submits an HTTP request to `/api/v1/nurse/triage/`, DRF returns HTTP `403 Forbidden`.
- In-page API errors (e.g. 403) are displayed as contextual inline alerts or field-level validation errors, never as full-page application blocking screens.

---

## Real-time WebSocket RBAC

Django Channels consumers in `backend/channels_app/consumers.py` authenticate connections using JWT scopes and execute asynchronous RBAC checks:
- `/ws/doctor/` → Restricted to `DOCTOR` role.
- `/ws/nurse/` → Restricted to `NURSE` role.
- `/ws/user/` → Restricted to `PATIENT` role.
- `/ws/informaticist/` → Restricted to `MEDICAL_INFORMATICIST` / `ANALYST` role.
- `/ws/admin/` → Restricted to `IT_ADMIN` / `ADMIN` role.

Unauthorized connection attempts are closed immediately with code `4003: Unauthorized / Forbidden`, preventing channel group joins. Client-sent role or user claims are never trusted; backend authenticated scope identity is the sole truth.
