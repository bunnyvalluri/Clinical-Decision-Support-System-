# Architectural Decision Record (ADR): Ollama Local LLM Inference Layer Integration

- **Status**: Approved
- **Deciders**: Enterprise AI Architect, Clinical Informatics Lead, Healthcare Security Officer, MLOps Lead
- **Date**: 2026-09-17

## Context
The Clinical Decision Support System requires natural language summarization of complex patient trajectories, explainability synthesis for classical ML risk predictions (TreeSHAP attributions), and clinical guideline question answering. Sending patient clinical context or hospital guidelines to commercial public cloud APIs (OpenAI, Anthropic, Google) introduces regulatory compliance friction, recurring egress token costs, and potential data sovereignty risks.

## Decision
We adopt **Ollama** (pinned at version `0.5.12`) as the self-hosted, local LLM inference runtime:
1. **Local Privacy Boundary**: Ollama runs in an internal Docker network, inaccessible from the public internet. Sensitive patient data stays within our infrastructure.
2. **Neon PostgreSQL Authority**: Neon PostgreSQL remains the sole authoritative source of truth for all model registries, session states, request logs, and clinician approvals.
3. **Preservation of ML Foundation**: Classical scikit-learn models remain the authoritative clinical prediction engine. Ollama strictly consumes prediction IDs and SHAP values to synthesize clinician-friendly explanations.
4. **Resilience by Design**: If Ollama fails, circuit breakers prevent system lockup, and core EHR/ML workflows remain 100% operational.
5. **Governed Model Lifecycle**: Only models approved by clinical informatics can be deployed for clinical user roles.

## Consequences
- **Positive**:
  - Full HIPAA Safe Harbor data privacy for local clinical inference.
  - Predictable infrastructure costs (no per-token cloud API charges).
  - Open model choice (Meta Llama 3.3, Qwen 2.5, DeepSeek-R1, Mistral).
  - Low-latency local embeddings for RAG over clinical practice guidelines.
- **Trade-offs / Mitigations**:
  - Requires local compute (VRAM / multi-core CPU) -> Addressed via quantization profiles (Q4_K_M) and CPU fallback mode.
  - Model lifecycle must be manually audited -> Addressed via automated evaluation benchmarks and `LLMModelRegistry` governance.
