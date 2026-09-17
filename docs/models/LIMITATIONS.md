# Model Limitations & Clinical Boundaries — BPY-CSE-2666

## Known Limitations
1. **Pediatric Patients**: The model is validated exclusively for adult patients ($\ge 18$ years of age). Pediatric vital normal ranges differ fundamentally.
2. **Pregnancy-Induced Physiological Shifts**: Hemodynamic shifts during third-trimester pregnancy are not explicitly accounted for in training baselines.
3. **Extreme Multi-Organ Failure**: Extreme lab values trigger Out-of-Distribution alerts requiring direct immediate ICU consultation.
