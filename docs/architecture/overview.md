# Architecture Overview

The **PatientRisk Clinical Decision Support System** is architected according to high-reliability software engineering principles designed to meet the rigorous demands of enterprise healthcare technology:

1. **Object-Oriented Programming (OOP):** Domain models, machine learning estimators, and real-time events are modeled as encapsulated classes with clear boundaries.
2. **SOLID Principles:**
   - *Single Responsibility:* Each service class (e.g., `PredictionService`, `ExplanationService`, `ReportService`) performs a single bounded clinical operation.
   - *Open/Closed:* Machine learning models and real-time event handlers can be extended without modifying core routing logic.
   - *Liskov Substitution:* All ML models implement standard scikit-learn estimator protocols.
   - *Interface Segregation:* DRF serializers are tailored to specific endpoints (read vs write) to eliminate over-fetching.
   - *Dependency Inversion:* Services depend on repository abstractions (`DjangoPredictionRepository`) rather than direct database queries.
3. **DRY (Don't Repeat Yourself):** Common model patterns (UUID primary keys, soft deletion, timestamp tracking) are encapsulated in `apps.core.models.BaseModel`.
4. **Service Layer Pattern:** Views handle HTTP serialization and authentication, delegating all domain logic to independent Python services.
