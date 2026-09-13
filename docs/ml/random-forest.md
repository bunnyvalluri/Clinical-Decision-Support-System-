# Random Forest Ensemble Classifier

The primary production algorithm is a Random Forest classifier consisting of 100 decorrelated decision trees.

---

## 1. Hyperparameter Specifications

```python
RandomForestClassifier(
    n_estimators=100,
    max_depth=6,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
```

- **Clinical Rationale:** Non-linear decision boundaries, high resistance to overfitting, and native compatibility with TreeSHAP.
