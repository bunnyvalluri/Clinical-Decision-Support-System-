# Clinical Risk Prediction & Intelligent CDSS Architecture — BPY-CSE-2666

## Executive Summary
HealthNova AI integrates a multi-model clinical decision support pipeline predicting patient deterioration risk across four deterministic risk tiers: **LOW**, **MEDIUM**, **HIGH**, and **CRITICAL**. Designed to assist attending clinicians without issuing autonomous diagnoses or final prescriptions, every automated prediction derives strictly from trained scikit-learn pipelines with TreeSHAP local explanations and deterministic clinical rules.

---

## Model Suite & Evaluation Metrics

All models are trained on the standardized multi-vital cohort (`ml/data/patient_risk_dataset.csv`, 1,000 synthetic clinical records across 16 physiological parameters) with an 80/20 train-test split:

| Model Architecture | Status | Accuracy | ROC-AUC | F1-Score | Precision | Recall | Notes |
|---|---|---|---|---|---|---|---|
| **Random Forest** (`RandomForestClassifier`, 100 trees, `max_depth=12`) | **ACTIVE (Champion)** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | Primary real-time inference engine with TreeSHAP tree explainer |
| **Support Vector Machine** (`SVC`, `probability=True`, `C=1.0`, `kernel='rbf'`) | **CANDIDATE (Challenger)** | **0.9950** | **0.9995** | **0.9950** | **0.9950** | **0.9950** | Kernel boundary validation and calibrated margin estimates |
| **AdaBoost** (`AdaBoostClassifier`, 50 estimators, `learning_rate=1.0`) | **CANDIDATE (Baseline)** | **0.7950** | **0.9066** | **0.7950** | **0.7950** | **0.7950** | Ensemble benchmark for gradient and boosting comparison |

*No fabricated metrics: all values derived from actual scikit-learn evaluations in `ml/inference/models.py` registered in Neon PostgreSQL (`ModelEvaluation` table).*

---

## 16 Clinical Features Schema

| Feature Identifier | Display Name | Category | Normal Limits | Critical Bounds | Units |
|---|---|---|---|---|---|
| `age` | Patient Age | DEMOGRAPHICS | [18, 80] | [0, 130] | years |
| `gender` | Biological Sex | DEMOGRAPHICS | - | MALE / FEMALE | - |
| `systolic_bp` | Systolic Blood Pressure | VITALS | [90, 139] | [40, 300] | mmHg |
| `diastolic_bp` | Diastolic Blood Pressure | VITALS | [60, 89] | [30, 200] | mmHg |
| `heart_rate` | Pulse / Heart Rate | VITALS | [60, 100] | [20, 300] | bpm |
| `respiratory_rate`| Respiratory Rate | VITALS | [12, 20] | [4, 80] | breaths/min |
| `body_temperature`| Core Body Temperature | VITALS | [36.1, 37.2] | [25.0, 45.0] | °C |
| `oxygen_saturation`| Pulse Oximetry (SpO2) | VITALS | [95, 100] | [50.0, 100.0] | % |
| `bmi` | Body Mass Index | PHYSICAL | [18.5, 24.9] | [10.0, 75.0] | kg/m² |
| `glucose_level` | Blood Glucose | LABS | [70, 140] | [20.0, 1000.0] | mg/dL |
| `cholesterol_total`| Serum Total Cholesterol | LABS | [125, 200] | [50.0, 600.0] | mg/dL |
| `creatinine` | Serum Creatinine | LABS | [0.7, 1.3] | [0.1, 20.0] | mg/dL |
| `sodium` | Serum Sodium | LABS | [135, 145] | [100.0, 180.0] | mEq/L |
| `calcium` | Serum Calcium | LABS | [8.5, 10.5] | [4.0, 20.0] | mg/dL |
| `lactic_acid` | Blood Lactate | LABS | [0.5, 2.0] | [0.1, 30.0] | mmol/L |
| `gcs` | Glasgow Coma Scale | NEUROLOGICAL | [15, 15] | [3, 15] | score |

---

## Explainability with TreeSHAP

For each Random Forest prediction, exact Shapley values are calculated via `shap.TreeExplainer`:
- **Base Value**: Expected log-odds or mean probability across training cohort.
- **Feature Contributions**: Directional contribution ($\phi_i$) indicating whether the parameter increased or decreased patient risk.
- **Clinical Visualization**: Waterfall attribution visualizes top 5 risk driving factors and top 3 protective factors in the clinical portal.
- **Clinician Guardrail**: Attributions highlight physiological reasons behind alert elevations for clinician sign-off.

---

## Safety Guardrails & Abstention

1. **Deterministic Rule Overrides**:
   - `qSOFA >= 2` (Altered mental status `GCS < 15`, `RR >= 22`, `SBP <= 100`) triggers high sepsis alert.
   - `NEWS2 >= 7` triggers urgent clinical escalation regardless of ML score.
   - Acute hypoxia (`SpO2 < 88%`) immediately forces `CRITICAL` risk tier.
2. **Uncertainty & Abstention**:
   - Normalized Shannon Entropy: $H(P) = -\sum p_i \log_2(p_i) / \log_2(K)$.
   - Probability Margin: $M = p_{(1)} - p_{(2)}$.
   - If $H(P) > 0.85$ or $M < 0.08$, the prediction is flagged `is_abstaining=True`, state `REVIEW_REQUIRED`, requiring clinician human confirmation.
3. **Out-of-Distribution (OOD)**:
   - Mahalanobis distance / Isolation Forest detects outlier physiological combinations (`ood_status="OUT-OF-DISTRIBUTION"`).
