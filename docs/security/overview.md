# Security & Compliance Overview

The **PatientRisk Clinical Decision Support System** implements defense-in-depth principles to protect Electronic Protected Health Information (ePHI) and uphold strict clinical accountability.

---

## 1. Compliance Alignment

- **HIPAA Security Rule:** Implements technical safeguards including unique user identification, emergency access procedures, automatic logoff, and audit controls.
- **Principle of Least Privilege:** Users receive only the permissions strictly required to execute their specific clinical or administrative tasks.
- **Zero Cleartext Credentials:** Passwords hashed using PBKDF2 with SHA-256; secrets injected via environment variables.
