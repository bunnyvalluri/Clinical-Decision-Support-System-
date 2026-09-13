# Patients API

Endpoints for managing patient demographic records.

---

## 1. Endpoints

### 1.1 `GET /api/v1/patients/`
List admitted patients with pagination, search, and sorting.
- **Query Parameters:**
  - `search`: Search by full name or MRN.
  - `page`: Page index (default: `1`).
  - `page_size`: Records per page (default: `20`).

### 1.2 `POST /api/v1/patients/`
Create a new patient demographic record.
- **Request Body:**
  ```json
  {
    "first_name": "Eleanor",
    "last_name": "Ward",
    "date_of_birth": "1958-04-12",
    "gender": "FEMALE",
    "blood_group": "A+",
    "phone_number": "+15551234567",
    "email": "eleanor.ward@patient.org",
    "address": "452 Medical Parkway, Suite 100"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "mrn": "MRN-2026-0814",
    "first_name": "Eleanor",
    "last_name": "Ward",
    "gender": "FEMALE"
  }
  ```

### 1.3 `GET /api/v1/patients/{id}/`
Retrieve patient profile details and assigned primary physician.

### 1.4 `DELETE /api/v1/patients/{id}/`
Soft delete patient record (sets `is_deleted = true`).
