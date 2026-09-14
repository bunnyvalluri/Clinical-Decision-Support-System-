# PocketBase Security & Trust Boundaries

## Security Principles

1. **Authentication Authority**:
   - Django remains the single source of truth for identity and password management.
   - User roles (`PATIENT`, `DOCTOR`, `NURSE`, `MEDICAL_INFORMATICIST`, `IT_ADMIN`) are authorized server-side in Django.
   - PocketBase does not issue authoritative healthcare tokens.

2. **No Privileged Keys in Frontend**:
   - Superuser credentials and admin tokens for PocketBase are **never** committed or exposed in Next.js environment variables.
   - Any administration of PocketBase happens on isolated administrative ports or CLI tooling.

3. **Collection API Rules**:
   - **`auxiliary_announcements`**:
     - `listRule`: `active = true`
     - `viewRule`: `active = true`
     - `createRule`: `@request.auth.role = "admin"` (Admin only)
     - `updateRule`: `@request.auth.role = "admin"`
     - `deleteRule`: `@request.auth.role = "admin"`
   - **`user_ui_preferences`**:
     - `listRule`: `@request.auth.id != "" && user_id = @request.auth.id`
     - `viewRule`: `@request.auth.id != "" && user_id = @request.auth.id`
     - `createRule`: `@request.auth.id != "" && user_id = @request.auth.id`
     - `updateRule`: `@request.auth.id != "" && user_id = @request.auth.id`
     - `deleteRule`: `@request.auth.id != "" && user_id = @request.auth.id`

4. **Zero PHI in File Storage**:
   - PocketBase file storage is strictly prohibited from holding patient records, lab scans, or diagnostic images.
