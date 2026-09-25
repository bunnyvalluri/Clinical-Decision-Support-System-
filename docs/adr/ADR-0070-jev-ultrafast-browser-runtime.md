# ADR-0070: Integration of Jev Ultrafast as a Controlled Browser Automation Runtime for HealthNova AI

## Status
**ACCEPTED / IMPLEMENTED**

## Context
HealthNova AI requires verified, resilient ingestion of clinical records (laboratory results, prior authorization statuses, external clinical registries) from external healthcare web portals where FHIR/HL7 APIs are unavailable or incomplete. Traditional browser automation runtimes (Selenium, Puppeteer, raw Playwright) suffer from:
1. High step latency (often 1000ms–3000ms per action) making complex clinical workflows fragile.
2. Unbounded, generative action spaces (generating arbitrary CSS selectors, XPaths, or raw JavaScript) susceptible to prompt injection and page DOM tampering.
3. Lack of independent verification mechanisms ("DONE != SUCCESS"), leading to false assumptions that a clinical record was successfully extracted or submitted.
4. Risk of unintended mutation retries causing duplicate prescription or billing entries in external portals.

`browser-use/jev-ultrafast` introduces an ultrafast, CDP-native (Chrome DevTools Protocol) runtime that:
- Indexes interactable DOM elements via an in-page snapshot script into a strict numbered action-space.
- Executes discrete actions (NAVIGATE, CLICK, INPUT, EXTRACT_TEXT, SCREENSHOT) in sub-50ms cycles without generating arbitrary scripts.
- Uses structured JSON action selection rather than freeform agent generation.

## Decision
We integrate Jev Ultrafast as an **optional, security-governed, non-diagnostic runtime provider** behind HealthNova AI's `BrowserAgentGateway`.

### Key Architectural Invariants
1. **Runtime Isolation Only**: Jev is strictly an execution runtime:
   `Browser Observation → Indexed Supported Elements → Controlled Action Selection → Safe Execution → Result Verification`.
2. **Strict Separation of Concerns**: Jev NEVER performs autonomous clinical diagnoses, prescriptions, guideline mutations, or model retraining.
3. **Gateway Abstraction**: The core application interacts only with `BrowserAgentGateway`, which routes between `JevUltrafastProvider` and `LayaSandboxProvider`.
4. **Single-Mutation Rule**: Tasks attempting state alterations are restricted to a maximum of one mutation per run. Blind retries of mutations are strictly forbidden.
5. **DONE != SUCCESS**: A task completion signal from the runtime does not equal clinical task success. An independent verification step (`BrowserVerification`) must confirm DOM state changes or retrieved payloads against expected schema invariants.
6. **Default-Deny SSRF Architecture**: All destination URLs are resolved to IP literals before connection and checked against private IP CIDRs (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`). All redirects are re-validated. Destination hosts must exist in `BrowserDestination` allowlist.
7. **Emergency Circuit Breakers**: Multi-tier kill switches (`BROWSER_AGENT_GLOBAL_ENABLED`, `JEV_ENABLED`, `BROWSER_MUTATIONS_ENABLED`) halt active CDP connections and reject new requests within 250ms.
8. **PHI Minimization**: Raw PHI is minimized before agent dispatch. Screenshots are disabled by default and scrubbed when active.
9. **Authoritative Store**: Neon PostgreSQL is the sole authoritative store for all task states, audit logs, and verification records.

## Consequences
- **Positive**: Sub-50ms execution enables responsive clinical portal automation with zero prompt injection escape vectors (no arbitrary code execution).
- **Positive**: Complete auditability with immutable audit logs stored in Neon PostgreSQL.
- **Negative / Trade-off**: Tasks cannot execute arbitrary single-page scripts outside the indexed action space; non-standard or heavily canvas-based portals require fallback or dedicated handlers.
