# Ollama Security & Healthcare Privacy Architecture

## 1. Zero PHI Egress Guarantee
- All clinical interactions processed by Ollama execute solely on local infrastructure.
- In-flight data traverses internal Unix sockets or secure private Docker bridge networks.
- Cloud fallback is explicitly hard-blocked for any request containing data classified as `PHI`, `RESTRICTED`, or `CONFIDENTIAL`.

## 2. Inbound Sanitization & Context Minimization
Before any prompt reaches Ollama:
1. `ClinicalRiskContextBuilder` strips patient direct identifiers (Name, MRN, SSN, Contact Information, Address).
2. De-identification conforms to HIPAA Safe Harbor de-identification rules.
3. Only normalized vitals, laboratory values, and de-identified clinical notes are formatted into the prompt context.

## 3. Defense Against Prompt Injection & Jailbreaks
- **Input Filtering**: Regular expression and heuristic scanners evaluate prompt text for override signatures (e.g. `ignore previous instructions`, `DAN mode`, `developer mode override`).
- **Delimiter Enforcement**: Patient vitals and clinical notes are injected using XML tags (`<clinical_context>...</clinical_context>`) with explicit instruction isolation.
- **Output Validation**: Responses are scanned for toxic patterns, synthetic hallucinations, or unauthorized prescription commands before returning to the UI.

## 4. Role-Based Access Control (RBAC)
- Only users with authorized roles (`DOCTOR`, `CLINICAL_INFORMATICIST`, `ADMIN`) may execute clinical reasoning prompts.
- Model administrative operations (pulling, deleting, status switching) are restricted strictly to `ADMIN` and `CLINICAL_INFORMATICIST`.

## 5. Audit Logging
Every request generates an immutable audit record in `AIRequest` and `AISession` in Neon PostgreSQL recording:
- Clinician ID & Role
- Model Name & Version Tag
- Request Hash & Token Count
- Latency (time to first token, total duration)
- Output Classification & Approval Status
