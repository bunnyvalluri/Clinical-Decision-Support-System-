# Testing & Quality Assurance Overview

The PatientRisk CDSS testing framework utilizes **Pytest** and **TypeScript Compiler (`tsc`)** to ensure deterministic clinical reliability.

---

## 1. Test Pyramid

- **Unit Tests:** Preprocessing, model feature transformations, serializer validations.
- **Integration Tests:** REST APIs, service layer orchestration, database constraints, Celery task execution.
- **End-to-End Test:** Complete 15-step clinical workflow test (`test_e2e_production_flow.py`).
