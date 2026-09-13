# Machine Learning Overview

The Machine Learning subsystem of the **PatientRisk CDSS** is an end-to-end predictive and interpretative framework designed to stratify cardiovascular patient risk.

---

## 1. Clinical Modeling Strategy

1. **Four-Tier Clinical Stratification:** Rather than a crude binary flag, the model maps continuous risk probability into four standardized clinical triage categories:
   - `LOW` (Probability < 0.30)
   - `MEDIUM` (0.30 <= Probability < 0.60)
   - `HIGH` (0.60 <= Probability < 0.85)
   - `CRITICAL` (Probability >= 0.85)
2. **Algorithm Diversity:** Explores Support Vector Machines (SVM), Random Forest, and AdaBoost to balance non-linear pattern recognition with interpretability.
3. **Transparent Explainability:** Pairs TreeSHAP attributions with localized natural language descriptions for every prediction.
