# Deterministic 7-Question Validation Gate

Every security finding candidate must be audited against the seven deterministic questions before being accepted:
1. **Is target in scope?**: Matches authorized `SecurityTarget.scope`.
2. **Is vulnerability reproducible?**: Steps and payload allow consistent verification.
3. **Is evidence sufficient?**: Sanitized HTTP trace or log evidence captured.
4. **Is impact real?**: Affects confidentiality, integrity, or availability.
5. **Is it duplicate?**: Fingerprint checked against `SecurityFindingCluster`.
6. **Is severity justified?**: CVSS score aligns with real system implications.
7. **Is remediation actionable?**: Concrete guidance provided for development teams.
