# Runbook 10: AI Gateway, Ollama & RAG Recovery

## 1. Symptoms
- AI Assistant chat or clinical summarization hangs or returns timeout.
- Ollama local inference socket disconnected.
- RAG evidence retrieval returns empty citations.

## 2. Detection
- System health check probe reports `ollama: UNHEALTHY`.
- AI Gateway endpoint returns HTTP 504 Gateway Timeout.

## 3. Preconditions
- Healthcare Invariant: **AI NEVER issues autonomous diagnoses**.
- Healthcare Invariant: **ZERO patient PHI is sent to unauthorized external providers during outages**.
- Clinical core functionality (patient records, vitals, deterministic qSOFA scoring) must continue safely.

## 4. Authorization
- AI Platform Engineer or SRE.

## 5. Step-by-Step Execution
1. **Activate Safe Clinical Degraded Mode**:
   Ensure UI renders `"Prediction service unavailable"`:
   ```bash
   curl -X POST http://localhost:8000/api/v1/ai/degraded-mode/enable/
   ```
2. **Restart Local Ollama Inference Daemon**:
   ```bash
   docker compose restart ollama
   ```
3. **Verify Model Weights Integrity**:
   Confirm approved clinical model weights are present in local Ollama store:
   ```bash
   ollama list
   ```
4. **Reconstruct RAG Vector Embeddings from Authoritative Records**:
   If vector embeddings are lost or corrupt, rebuild from approved literature records in Neon:
   ```bash
   python manage.py reindex_rag_evidence --force
   ```
5. **Verify AI Gateway Policy Rules**:
   Ensure prompt injection and PHI sanitization filters are intact before re-enabling inference.

## 6. Validation
- Run test clinical query with synthetic patient data.
- Confirm zero PHI is transmitted to unauthorized public endpoints.
- Confirm grounding score and citation URLs are populated.

## 7. Rollback
- If local Ollama remains degraded, keep safe degraded mode active. Bedside staff proceed with human clinical judgment.

## 8. Escalation Path
- AI Platform Lead -> Clinical Safety Officer.

## 9. Post-Recovery Monitoring
- Monitor AI inference latency and grounding scores for 4 hours.
