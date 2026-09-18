# Dataset Card: Pima Indians Diabetes Database

## 1. Summary & Clinical Identity
- **Dataset Ref**: `uciml/pima-indians-diabetes-database`
- **Clinical Focus**: Type 2 Diabetes Mellitus risk stratification
- **Author**: National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)
- **License**: CC0: Public Domain
- **Format**: Tabular CSV (`diabetes.csv`)
- **Rows**: 768 | **Columns**: 9

## 2. Feature Dictionary & LOINC Mappings
| Column | LOINC / Standard | Physiological Unit | Observed Min | Observed Max | Clinical Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Pregnancies` | — | Count | 0 | 17 | Number of pregnancies |
| `Glucose` | 2345-7 | mg/dL | 0 (imputed) | 199 | 2-hour oral glucose tolerance test |
| `BloodPressure` | 8462-4 | mmHg (diastolic) | 0 (imputed) | 122 | Diastolic blood pressure |
| `SkinThickness` | — | mm | 0 (imputed) | 99 | Triceps skin fold thickness |
| `Insulin` | 2484-4 | μU/mL | 0 (imputed) | 846 | 2-hour serum insulin |
| `BMI` | 39156-5 | kg/m² | 0 (imputed) | 67.1 | Body Mass Index (weight in kg / (height in m)²) |
| `DiabetesPedigreeFunction` | — | Score | 0.078 | 2.42 | Genetic scoring function |
| `Age` | 30525-0 | Years | 21 | 81 | Patient age |
| `Outcome` | — | Binary (0/1) | 0 | 1 | Diabetes diagnosis (1 = positive) |

## 3. Data Hygiene & Clinical Remediation
- **Biologically Impossible Zeros**: In the raw dataset, missing clinical observations were recorded as `0`. Insulin contains 374 zeros (48.7%), SkinThickness contains 227 zeros (29.6%), BloodPressure contains 35 zeros (4.6%), and Glucose contains 5 zeros (0.65%).
- **Transformation Pipeline**: The pipeline converts zeros in these columns to `np.nan` and applies median imputation segmented by age decile before model feeding.
