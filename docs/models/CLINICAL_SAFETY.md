# Clinical Safety Assessment & Oversight — BPY-CSE-2666

## Human-in-the-Loop Clinical Invariant
1. The machine learning model provides advisory risk stratification, NOT autonomous medical diagnoses or treatment orders.
2. An attending physician or registered nurse retains 100% medical responsibility for patient care decisions.
3. If an input vector is determined to be Out-of-Distribution (OOD Mahalanobis distance $> 4.5$ or reconstruction error $> 0.15$), the model flags `REVIEW_REQUIRED` and does not issue automated confidence scores.
4. Clinicians may override any algorithmic suggestion with documented clinical rationale.
