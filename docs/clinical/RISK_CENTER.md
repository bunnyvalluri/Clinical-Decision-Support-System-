# Unified Clinical Risk Center Architecture — BPY-CSE-2666

## Multi-Role Risk Center Matrix

HealthNova AI provides role-tailored Risk Center views designed around specific clinical responsibilities and access policies:

| Role | Route | Purpose | Key Capabilities |
|---|---|---|---|
| **Doctor / Physician** | `/doctor/predictions` | Bedside Risk Inferences & Review | View real-time inferences, TreeSHAP waterfall explanations, deterministic alerts, accept/override prediction with clinical comment. |
| **User / Patient** | `/user/risk` | Transparent Health Journey | Understand personal assessed risk tier, review plain-language guidance, view longitudinal trajectory. (Zero raw internal model weights). |
| **Nurse / Triage** | `/nurse/risk-screening` | Rapid Deterioration Screening | Ward census monitoring, ESI triage scoring, qSOFA sepsis screening, instant one-click physician escalation. |
| **Medical Informaticist** | `/informaticist/analytics/predictions` | Population Telemetry & ML Governance | Real-time prediction distributions, ROC-AUC calibration, model comparison benchmarks, abstention and OOD rates. |

---

## Prediction Review Lifecycle States

Under no circumstances does generating a prediction imply that it is clinically accepted. All predictions transition through formal auditable states:
1. **`GENERATED`**: Model inference completed, TreeSHAP attributions synthesized.
2. **`PENDING_REVIEW`**: Notification dispatched to attending physician; awaiting clinical sign-off.
3. **`UNDER_REVIEW`**: Physician has opened prediction and is reviewing parameters.
4. **`REVIEWED`**: Physician has reviewed and concurred with AI risk stratification.
5. **`ACCEPTED_FOR_CONSIDERATION`**: Informaticist / specialist has accepted for clinical trial cohort.
6. **`REJECTED`**: Clinician rejects recommendation due to clinical confounding factors.
7. **`REQUIRES_MORE_INFORMATION`**: Additional laboratory panels or vitals ordered before decision.
8. **`ESCALATED`**: Nurse or resident has escalated critical case to ICU / Chief of Staff.
9. **`SUPERSEDED`**: A newer prediction was generated during the current encounter.
10. **`EXPIRED`**: Encounter concluded or time horizon elapsed without review.
11. **`ERROR`**: Preprocessing or validation exception encountered.
