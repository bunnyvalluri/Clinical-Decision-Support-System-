# Model Training & Validation Strategy

Models are trained using stratified 5-fold cross-validation with grid search hyperparameter tuning.

---

## 1. Cross-Validation Configuration

```python
from sklearn.model_selection import StratifiedKFold, GridSearchCV

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
```

- **Objective Metric:** ROC-AUC (Area Under the Receiver Operating Characteristic Curve), with secondary priority on Recall / Sensitivity to minimize false negatives in high-risk patients.
