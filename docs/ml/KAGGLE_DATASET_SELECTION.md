# Clinical Machine Learning: Kaggle Dataset Selection & Rationale

## 1. Clinical Scope & Context
In a Clinical Decision Support System (CDSS) providing real-time patient risk stratification, training data must accurately reflect genuine physiological dynamics, demographic distributions, and clinical biomarkers. Kaggle provides a vast repository of public datasets; however, untrusted or synthetic data without clinical provenance poses severe risks of miscalibration, target leakage, and algorithmic bias.

## 2. Benchmark Datasets Selected

### Primary Dataset 1: Pima Indians Diabetes Database
- **Reference**: `uciml/pima-indians-diabetes-database`
- **Clinical Problem**: Type 2 Diabetes onset prediction in high-risk adult female populations.
- **Biomarkers**: Fasting plasma glucose, diastolic blood pressure, BMI, serum insulin, triceps skinfold thickness, pedigree function, age, pregnancies.
- **Authoritative Provenance**: National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK).
- **Licensing**: CC0: Public Domain (Commercial and clinical research permitted).
- **Known Anomalies & Remediation**: Legacy zero encoding for missing values in insulin (48.7%) and skinfold thickness (29.6%). Handled through KNN/iterative median imputation.

### Primary Dataset 2: Stroke Prediction Dataset
- **Reference**: `fedesoriano/stroke-prediction-dataset`
- **Clinical Problem**: Acute cerebrovascular accident (ischemic / hemorrhagic stroke) risk prediction.
- **Biomarkers**: Age, average blood glucose level, BMI, hypertension history, heart disease history, smoking status, gender.
- **Target Distribution**: Severe class imbalance (4.8% stroke incidence), closely mimicking genuine population base rates.
- **Licensing**: CC0: Public Domain.
- **Known Anomalies & Remediation**: 201 missing BMI values; imputed via age-band median. Class-weighted cost functions and stratified folds applied.

### Primary Dataset 3: Heart Disease Dataset (Cleveland Clinic)
- **Reference**: `johnsmith88/heart-disease-dataset`
- **Clinical Problem**: Coronary artery disease and ischemic heart disease presence.
- **Biomarkers**: Resting systolic BP (`trestbps`), serum cholesterol (`chol`), fasting blood sugar (`fbs`), resting ECG (`restecg`), maximum heart rate (`thalach`), exercise-induced angina (`exang`), ST depression (`oldpeak`), fluoroscopy vessels (`ca`), thallium stress test (`thal`).
- **Provenance**: Cleveland Clinic Foundation, Hungarian Institute of Cardiology.
- **Licensing**: CC0: Public Domain.

## 3. Disqualified Datasets
| Dataset Ref | Reason for Rejection | Healthcare Invariant Trigger |
| :--- | :--- | :--- |
| `synthetic-medical-data-vault` | Artificially generated with CTGAN; flat uniform variances | Fails synthetic data gate; non-biological |
| `covid-19-unredacted-survey` | Contains non-truncated ZIP codes and exact dates of birth | HIPAA Safe Harbor direct identifier violation |
| `icu-patient-admissions-raw` | Includes `discharge_status` and `icu_days_total` alongside admission vitals | Target leakage / post-outcome variables |
