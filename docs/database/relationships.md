# Database Relationships & Constraints

This document defines relational integrity rules and foreign key cascade behaviors.

---

## 1. Key Relationships

| Parent Table | Child Table | Relation Type | Cascade Rule | Business Rationale |
|---|---|---|---|---|
| `User` | `Patient` | One-to-Many | `ON DELETE SET_NULL` | Retains patient records if attending physician account is deactivated |
| `Patient` | `ClinicalRecord` | One-to-Many | `ON DELETE CASCADE` | Observations are bound to patient lifespan |
| `Patient` | `Prediction` | One-to-Many | `ON DELETE CASCADE` | Predictions belong to patient longitudinal history |
| `ClinicalRecord` | `Prediction` | One-to-Many | `ON DELETE SET_NULL` | Predictions retained even if observation record is edited |
| `Prediction` | `PredictionExplanation`| One-to-One | `ON DELETE CASCADE` | Explanation is strictly bound to its parent inference |
| `ModelVersion` | `Prediction` | One-to-Many | `ON DELETE PROTECT` | Prevents deleting ML model versions that have active clinical predictions |
