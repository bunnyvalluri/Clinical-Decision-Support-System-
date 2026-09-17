# AI Incident Response & Runbooks

## Severity Classifications

| Severity Level | Definition | SLA for Triage | Notification Targets | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Autonomous clinical action attempted, PHI exfiltration, active injection breach | Immediate (< 15 min) | Chief Medical Officer, Lead Architect, Security Officer | Activate AI Kill Switch; quarantine affected accounts |
| **SEV-2 (High)** | Severe hallucination presented to physician, retrieval pipeline outage | < 1 hour | Informaticist on-call, ML Engineer | Revert to deterministic fallback rules; suspend RAG updates |
| **SEV-3 (Medium)** | Provider latency degradation (> 5s), rate-limit spikes | < 4 hours | DevOps, ML Engineer | Switch to secondary provider adapter; scale worker pools |
| **SEV-4 (Low)** | Minor formatting bug, citation DOI dead link | < 24 hours | Development Team | Bug fix sprint queue |

---

## Runbook 1: Active Prompt Injection or Jailbreak Attempt

1. **Detection**: `AISafetyEngine` triggers `FLAGGED` or `SUPPRESSED` with `guardrail_flags: ["PROMPT_INJECTION_DETECTED"]`.
2. **Containment**:
   - The user's active session is suspended for 15 minutes.
   - The IP address is throttled to 1 request per hour via Redis.
3. **Investigation**:
   - Query `ai_interactions` and `ai_agent_traces` by `correlation_id`.
   - Inspect raw prompt text in isolated administrative audit console (redacted for external export).
4. **Remediation**:
   - Update injection pattern regexes in `backend/ai/safety/sanitizer.py`.
   - Run golden red-team regression suite (`pytest backend/apps/ai_orchestrator/tests/test_redteam.py`).

---

## Runbook 2: Provider Outage or Circuit Breaker Trip

1. **Detection**: `AIGateway` records 3 consecutive 5xx errors from primary provider (e.g. Anthropic).
2. **Automated Action**:
   - Circuit breaker trips to `OPEN`.
   - Traffic shifts automatically to Secondary Provider (e.g. OpenAI / Google Gemini).
   - Real-time notification dispatched to `#clinical-ops-alerts` Slack/email channel.
3. **Manual Fallback**:
   - If all external providers are unavailable, the gateway automatically switches to `LocalModelProvider` (Ollama) or emits deterministic `AI_SERVICE_UNAVAILABLE` with local deterministic clinical rule evaluations.

---

## Runbook 3: Model Hallucination Reported by Clinician

1. **Detection**: Clinician flags recommendation via UI button: *"Report Inaccurate AI Output"*.
2. **Investigation**:
   - Retrieve `AIInteraction` and corresponding `KnowledgeRetrieval` entries.
   - Calculate grounding score against actual source chunks.
   - Determine whether failure was **Retrieval Miss** (guideline chunk was absent) or **Generation Hallucination** (LLM added ungrounded claims).
3. **Resolution**:
   - If retrieval miss: Ingest updated institutional guideline or re-chunk existing guideline.
   - If generation hallucination: Adjust prompt temperature down and strengthen Pydantic citation validation rules.
