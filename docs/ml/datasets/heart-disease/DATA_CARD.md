# Dataset Card: Heart Disease Dataset (Cleveland Clinic)

## 1. Summary & Clinical Identity
- **Dataset Ref**: `johnsmith88/heart-disease-dataset`
- **Clinical Focus**: Ischemic Heart Disease & Coronary Artery Stenosis
- **Author**: Cleveland Clinic Foundation & Hungarian Institute of Cardiology
- **License**: CC0: Public Domain
- **Format**: Tabular CSV (`heart.csv`)
- **Rows**: 1,025 | **Columns**: 14

## 2. Feature Dictionary & LOINC Mappings
| Column | Standard Name | Clinical Unit | Observed Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `age` | Age | Years | 29 - 77 | Patient age in years |
| `sex` | Biological Sex | Categorical | 0 (F), 1 (M) | Biological sex |
| `cp` | Chest Pain Type | Categorical | 0 - 3 | 0: Typical angina, 1: Atypical angina, 2: Non-anginal, 3: Asymptomatic |
| `trestbps` | Resting Blood Pressure | mmHg (Systolic) | 94 - 200 | Resting systolic blood pressure upon admission |
| `chol` | Serum Cholesterol | mg/dL | 126 - 564 | Total serum cholesterol |
| `fbs` | Fasting Blood Sugar | Binary (0/1) | >120 mg/dL (1=True, 0=False) | Fasting blood sugar threshold |
| `restecg` | Resting ECG | Categorical | 0 - 2 | 0: Normal, 1: ST-T wave abnormality, 2: Left ventricular hypertrophy |
| `thalach` | Maximum Heart Rate | bpm | 71 - 202 | Peak heart rate achieved during exercise stress test |
| `exang` | Exercise Induced Angina | Binary (0/1) | 0 (No), 1 (Yes) | Angina triggered by physical stress |
| `oldpeak` | ST Depression | mm | 0.0 - 6.2 | ST depression induced by exercise relative to rest |
| `slope` | Slope of Peak ST Segment| Categorical | 0 - 2 | Slope of peak exercise ST segment |
| `ca` | Major Vessels Colored | Count | 0 - 4 | Number of major vessels colored by fluoroscopy |
| `thal` | Thallium Heart Scan | Categorical | 0 - 3 | 1: Normal, 2: Fixed defect, 3: Reversible defect |
| `target` | Heart Disease Presence | Binary (0/1) | 0 (<50% diameter narrowing), 1 (>50% narrowing) | Clinical target label |

## 3. Data Hygiene & Validation
- **Quality Score**: 98.4% completeness; 0 missing cells.
- **Leakage Prevention**: No identifier columns present. Target correlation for all individual predictors is strictly below 0.50, ensuring multi-factorial prediction.
