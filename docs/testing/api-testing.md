# REST API Test Suite

API endpoints are tested using Django REST Framework's `APIClient`:
- Verifies HTTP status codes (`200`, `201`, `202`, `422`).
- Asserts presence of standardized envelope keys (`success`, `data`, `error`).
- Verifies permission denial (`403`) for unauthorized roles.
