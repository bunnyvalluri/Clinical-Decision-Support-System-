# AdaBoost Classifier

Adaptive Boosting sequentially weights difficult clinical cases using shallow decision trees.

---

## 1. Specifications

- **Base Estimator:** DecisionTreeClassifier (`max_depth=1`)
- **Number of Estimators:** 50
- **Learning Rate:** 0.8
- **Behavior:** Highly sensitive to acute boundary observations; useful as a challenger model.
