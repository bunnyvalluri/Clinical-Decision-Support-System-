# Healthcare AI Safety & Prompt Injection Mitigation

## 1. Multi-Layer Guardrails
The platform implements defense-in-depth safety layers:
1. **Pre-Execution Scanning**: Regular expression and heuristic scanning for adversarial prompt injections, jailbreaks, system prompt overrides, and unauthorized SQL patterns.
2. **Context Minimization**: Only de-identified vitals and clinical parameters are passed into prompts; direct demographic identifiers are excluded.
3. **Autonomy Blockade**: The `ValidationService` rejects autonomous prescription or medication ordering, ensuring recommendations are flagged as requiring independent physician verification.
4. **Global Kill Switch**: The environment variable `AI_AGENT_GLOBAL_ENABLED=false` immediately halts all agent executions.

## 2. Safety Incident Logging
Any detected safety violation automatically creates an immutable `AgentSafetyEvent` record in Neon PostgreSQL:
- `PROMPT_INJECTION`
- `UNAUTHORIZED_TOOL`
- `PHI_VIOLATION`
- `UNSAFE_OUTPUT`
- `HALLUCINATION_DETECTED`

Incidents are audited with correlation IDs, calling user IDs, and severity classifications.
