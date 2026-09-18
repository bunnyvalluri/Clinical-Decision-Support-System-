# Kaggle Dataset Licensing Governance

## 1. Regulatory & Intellectual Property Policy
Clinical algorithms integrated into hospital environments must adhere to strict licensing boundaries to ensure clinical use, auditing rights, and commercial readiness.

## 2. License Tiers & Permissions Matrix
| License Type | Permitted in CDSS? | Commercial Use | Clinical Research | Attribution Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **CC0: Public Domain** | YES (Unrestricted) | YES | YES | None (Recommended) |
| **CC-BY 4.0** | YES (Approved) | YES | YES | Mandatory Citation |
| **MIT / BSD / Apache 2.0** | YES (Approved) | YES | YES | Include License Notice |
| **ODbL (Open Database License)**| REVIEW REQUIRED | Conditional | YES | Share-Alike on Derivative DBs |
| **CC-BY-NC 4.0 (Non-Commercial)**| BLOCKED for Prod | NO | Research Only | Mandatory Citation |
| **Unknown / Unspecified** | BLOCKED | NO | NO | Informaticist Audit Needed |

## 3. Automated & Manual Enforcement
- Ingestion pipelines extract `license_name` and tag the dataset automatically.
- Datasets bearing non-commercial (`NC`) or restrictive clauses are blocked from `CLINICAL_TRAINING` approval tiers.
- The `DatasetLicenseReview` model tracks formal legal approval for enterprise deployments.
