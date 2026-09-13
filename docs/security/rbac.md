# Role-Based Access Control (RBAC) Matrix

| Permission / Action | ADMIN | CLINICIAN / DOCTOR | NURSE | ANALYST | PATIENT |
|---|---|---|---|---|---|
| Register User Accounts | Yes | No | No | No | No |
| Admit Patient | Yes | Yes | Yes | No | No |
| Record Vital Signs | Yes | Yes | Yes | No | No |
| Request ML Prediction | Yes | Yes | No | No | No |
| Record Clinical Override | No | Yes | No | No | No |
| Download PDF Reports | Yes | Yes | Yes | No | Own Only |
| View System Audit Logs | Yes | No | No | No | No |
| Promote Model Versions | Yes | No | No | No | No |
