# Support Vector Machine (SVM) Classifier

The Support Vector Classifier projects clinical measurements into high-dimensional space via an RBF kernel.

---

## 1. Model Configuration

- **Kernel:** Radial Basis Function (`rbf`)
- **Hyperparameters:**
  - $C = 1.0$ (Regularization parameter)
  - $\gamma = \text{'scale'}$
  - `probability = True` (Enables Platt scaling for calibrated probability estimates)
- **Strengths:** Robust against high-dimensional collinear features.
