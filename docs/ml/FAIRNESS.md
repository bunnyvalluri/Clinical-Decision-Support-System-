# Clinical Fairness & Demographic Parity — BPY-CSE-2666

## Principles
Healthcare algorithms must exhibit consistent clinical sensitivity across demographic subgroups.
Evaluated strata:
1. **Biological Sex:** Male vs. Female sensitivity and false-negative rate parity.
2. **Age Cohorts:** 18-49, 50-69, and 70+ years.

## Governance Standards
- **Disparate Impact Ratio:** Minimum threshold of 0.80 required for model promotion.
- **Sample-Size Transparency:** Mandatory warnings displayed whenever a subgroup sample size is insufficient (<50 records).
- **Zero Fabrication:** Unfavorable disparities are displayed honestly on the `FairnessEvaluationDashboard` rather than concealed.
