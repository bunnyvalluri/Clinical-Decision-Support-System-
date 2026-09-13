# Explainable AI (SHAP)

The system embeds **TreeSHAP** to transform black-box predictions into transparent clinical factors.

---

## 1. Natural Language Description Generation

In `ml/explainability/explainer.py`, each numeric SHAP attribution is translated into a clinician-friendly sentence:
- *Elevated systolic blood pressure (172 mmHg) increases cardiovascular risk.*
- *Normal oxygen saturation (99%) serves as a protective factor.*
- *Elevated serum glucose (184 mg/dL) contributes to metabolic risk elevation.*
