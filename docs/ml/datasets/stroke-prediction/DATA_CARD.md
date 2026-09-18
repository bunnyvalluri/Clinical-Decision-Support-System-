# Dataset Card: Stroke Prediction Dataset

## 1. Summary & Clinical Identity
- **Dataset Ref**: `fedesoriano/stroke-prediction-dataset`
- **Clinical Focus**: Acute Cerebrovascular Accident (Stroke) Risk Prediction
- **Author**: fedesoriano
- **License**: CC0: Public Domain
- **Format**: Tabular CSV (`healthcare-dataset-stroke-data.csv`)
- **Rows**: 5,110 | **Columns**: 12

## 2. Feature Dictionary & LOINC Mappings
| Column | LOINC / Standard | Physiological Unit | Observed Min | Observed Max | Clinical Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | — | Identifier | 67 | 72940 | Arbitrary patient ID (excluded from training) |
| `gender` | 76689-9 | Categorical | Female | Male / Other | Patient gender |
| `age` | 30525-0 | Years | 0.08 | 82.0 | Patient age |
| `hypertension` | — | Binary (0/1) | 0 | 1 | Chronic hypertension diagnosis |
| `heart_disease` | — | Binary (0/1) | 0 | 1 | Pre-existing cardiovascular disease |
| `ever_married` | — | Binary | No | Yes | Marital status |
| `work_type` | — | Categorical | children | Govt_job | Employment category |
| `Residence_type`| — | Categorical | Rural | Urban | Living environment |
| `avg_glucose_level` | 2345-7 | mg/dL | 55.12 | 271.74 | Average blood glucose |
| `bmi` | 39156-5 | kg/m² | 10.3 | 97.6 | Body Mass Index |
| `smoking_status` | 72166-2 | Categorical | formerly smoked | smokes / never / Unknown | Tobacco history |
| `stroke` | — | Binary (0/1) | 0 | 1 | Target: 1 = suffered stroke, 0 = no |

## 3. Data Hygiene & Clinical Remediation
- **Missingness**: `bmi` has 201 missing values (3.9%). Handled via cohort-median imputation grouped by age group and gender.
- **Identifier Leakage**: `id` is stripped automatically by `DataLeakageDetector` prior to training to prevent memorization.
- **Extreme Class Imbalance**: Positive strokes occur in 249 of 5,110 records (4.87%). Handled with `class_weight="balanced"` and PR-AUC calibration.
