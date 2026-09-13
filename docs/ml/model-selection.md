# Model Selection Rationale

Why **Random Forest** was designated as the active production model:

1. **Superior ROC-AUC (0.934):** Delivers optimal discrimination between stable patients and those at risk of adverse cardiac events.
2. **Low Brier Score (0.089):** Reflects superior probability calibration, ensuring a 80% risk estimate reflects an actual 80% empirical risk.
3. **Native TreeSHAP Support:** Computes exact polynomial-time SHAP attributions in sub-5ms, unlike SVM which requires slow KernelSHAP sampling approximations.
