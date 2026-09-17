# Feature Changelog: Patient Risk Level Prediction

**Feature ID**: `FEAT-PRED-001`  

---

## [1.0.0] - 2026-09-17
### Added
- Multi-class risk prediction (`LOW`, `MEDIUM`, `HIGH`) using calibrated Random Forest / AdaBoost ensemble.
- Local TreeSHAP attribution generation returning normalized physiological contributions.
- Deterministic qSOFA and NEWS2 override safety guardrail.
- Object-level authorization via `HasPatientAccess` permission class.
- Real-time post-commit WebSocket broadcast to nurse triage channel.
- Attending physician clinical review sign-off workflow in Neon PostgreSQL.
- Light-theme clinical dashboard cards with high-contrast accessibility compliance.
