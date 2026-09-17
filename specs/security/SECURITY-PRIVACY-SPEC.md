# Security & Privacy Specification

**Spec ID**: `SEC-SPEC-001`  
**Domain**: Multi-Tier Authorization, Threat Modeling, & PHI Protection  
**Status**: `CONVERGED`  
**Reviewer**: `Healthcare Security & Privacy Agents`  

---

## 1. Multi-Tier Authorization Architecture

Every incoming clinical request is evaluated by three independent layers:
1. **Authentication Gate**: Cryptographic JWT validation or authenticated Django session.
2. **Role-Based Access Control (RBAC)**: Verification of role against the sovereign portal endpoints:
   - Patient (`/user/*`)
   - Doctor (`/doctor/*`)
   - Nurse (`/nurse/*`)
   - Medical Informaticist (`/informaticist/*`)
   - System Administrator (`/admin/*`)
3. **Object-Level Authorization (`HasPatientAccess`)**:
   - Explicit database query verifying that the physician/nurse has an assigned clinical care relationship with the target patient.
   - Prevents Insecure Direct Object References (IDOR/BOLA) across patient records.

---

## 2. Privacy & Context Minimization (Zero PHI in AI/Agents)

1. **Context Minimizer (`ClinicalRiskContextBuilder`)**:
   - Strips patient names, medical record numbers (MRNs), addresses, social security numbers, and contact information before vectorization, AI agent evaluation, or ML inference.
   - Evaluates only pseudorandom UUIDs and normalized numeric vitals.
2. **AI Log & Memory Quarantine**:
   - Ruflo agent memory and Cline task transcripts are forbidden from recording raw patient identifiers.
   - Prompt sanitization filters redact credit cards, phone numbers, and names using regex patterns.

---

## 3. Threat Model & Defenses

- **Insecure Direct Object References (IDOR)**: Mitigated by Django DRF `HasPatientAccess` permission class asserting active provider-patient assignment on every detail endpoint.
- **Prompt Injection (Direct & Indirect)**: Defense-in-depth:
  - Strict demarcation of System, User, Context, and Tool schemas.
  - Regex and semantic scan for instruction-override phrases.
  - Default-deny tool allowlist.
- **SQL Injection**: Exclusively parameterized queries via Django ORM; raw SQL strictly forbidden in application services.
- **Cross-Site Scripting (XSS)**: Next.js React JSX automatic output encoding; strict Content Security Policy (CSP).
- **Cross-Site Request Forgery (CSRF)**: SameSite cookies and CSRF tokens enforced on all state-changing endpoints.
