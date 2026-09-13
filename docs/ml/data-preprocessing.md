# Data Preprocessing Pipeline

The preprocessing pipeline cleans, imputes, and normalizes raw clinical measurements before passing them to estimators.

---

## 1. Preprocessing Steps (`ml/preprocessing/preprocessor.py`)

1. **Missing Value Imputation:**
   - Continuous vitals (BP, HR, glucose): Median imputation.
   - Categorical indicators (ECG, slope, chest pain): Most-frequent mode imputation.
2. **Standardization:**
   - Numerical features are transformed using `StandardScaler` ($z = (x - \mu) / \sigma$).
3. **Categorical Encoding:**
   - Multi-class clinical features are encoded with `OneHotEncoder(handle_unknown='ignore')`.
4. **Data Leakage Prevention:**
   - Fit operations are strictly executed only on training folds; test folds are purely transformed.
