# Clinical Workflows & User Personas — BPY-CSE-2666

## Doctor Persona & Workflow
Attending cardiologists and ward physicians interact with the CDSS through dedicated clinical routes:
- `/doctor/dashboard`: Ward census, high-risk patient overview, pending reviews queue.
- `/doctor/patients/:patientId`: Patient profile, current risk summary, vital trends.
- `/doctor/patients/:patientId/timeline`: Longitudinal chronological event stream aggregating admissions, encounters, predictions, and notes.
- `/doctor/patients/:patientId/predictions`: Sequential prediction history (`Prediction #1`, `#2`...) with trajectory delta chips.
- `/doctor/patients/:patientId/predictions/:predictionId`: In-depth SHAP factor attributions and inference snapshot.
- `/doctor/reviews/:reviewId`: Human-in-the-loop attestation and override interface with mandatory clinical rationale logging.

## Nurse Persona & Workflow
Triage nurses manage patient intake and bed assignments:
- `/nurse/dashboard`: Emergency department triage queue and telemetry monitors.
- `/nurse/triage`: Acuity assessment (ESI 1-5) and reassessment scheduling.
- `/nurse/patients/:patientId/vitals/new`: Immediate vitals recording with automatic risk engine triggering.
- `/nurse/escalations`: Bedside alerts for deteriorating patients requiring physician intervention.

## Medical Informaticist Persona & Workflow
Clinical informaticists oversee model governance and dataset fidelity:
- `/informaticist/models/research`: Academic benchmark laboratory comparing SVM, Random Forest, and AdaBoost.
- `/informaticist/data-quality`: Physiological bounds audit and anomaly remediation.
- `/informaticist/drift`: Feature-level PSI and Kolmogorov-Smirnov distribution shifts.
