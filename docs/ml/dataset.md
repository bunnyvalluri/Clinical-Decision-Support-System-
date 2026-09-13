# Dataset & Clinical Features

The models are trained and benchmarked on the benchmark **UCI Heart Disease Dataset (Cleveland Clinic cohort)** augmented with modern clinical observation features.

---

## 1. Baseline Clinical Variables

| Feature | Data Type | Clinical Normal Range | Description |
|---|---|---|---|
| `age` | Integer | 18 – 100 years | Patient biological age |
| `sex` | Categorical | Male (1), Female (0) | Biological sex |
| `chest_pain_type` | Categorical | 1 (Typical), 2 (Atypical), 3 (Non-anginal), 4 (Asymptomatic) | Type of reported anginal pain |
| `resting_bp` | Numeric | 90 – 120 mmHg | Resting systolic blood pressure on admission |
| `cholesterol` | Numeric | 150 – 200 mg/dL | Serum cholesterol |
| `fasting_blood_sugar` | Binary | > 120 mg/dL (1), <= 120 mg/dL (0) | Fasting blood sugar threshold |
| `resting_ecg` | Categorical | Normal (0), ST-T wave (1), Hypertrophy (2) | Resting electrocardiogram findings |
| `max_heart_rate` | Numeric | 60 – 200 bpm | Maximum heart rate achieved during exercise |
| `exercise_angina` | Binary | Yes (1), No (0) | Exercise-induced angina pectoris |
| `st_depression` | Numeric | 0.0 – 6.0 mm | ST depression induced by exercise relative to rest |
| `slope` | Categorical | Upsloping (1), Flat (2), Downsloping (3) | Slope of peak exercise ST segment |
| `major_vessels` | Integer | 0 – 3 | Number of major vessels colored by fluoroscopy |
| `thalassemia` | Categorical | Normal (3), Fixed defect (6), Reversible defect (7) | Thallium stress scintigraphy |
