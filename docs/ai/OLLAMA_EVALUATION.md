# Ollama Evaluation & Clinical Quality Assurance

## 1. Evaluation Objectives
Every model candidate evaluated for clinical deployment must undergo systematic validation before receiving the `APPROVED` state in `LLMModelRegistry`.

## 2. Benchmark Battery
1. **Clinical Accuracy & Reasoning**: Evaluated using curated synthetic clinical vignettes (e.g., sepsis triage, cardiovascular risk assessment).
2. **Hallucination Rate**: Automated checking against reference clinical gold-standard guidelines.
3. **Structured Output Adherence**: Verifying that JSON responses match strict Pydantic/JSON schemas without syntax errors.
4. **Toxicity & Safety**: Ensuring refusal to provide lethal drug dosages, non-approved interventions, or harmful medical recommendations.
5. **Inference Latency & Throughput**:
   - Time to First Token (TTFT): Must be < 1.5s on GPU / < 3.5s on CPU.
   - Generation Speed: > 25 tokens/second (GPU), > 10 tokens/second (CPU).

## 3. Continuous Drift & Quality Monitoring
- Periodic Celery tasks run automated regression benchmarks against installed models.
- Results are logged in Neon PostgreSQL and displayed in the Admin Model Management dashboard.
- Any degradation in structured output compliance (> 2% schema violations) triggers automated rollback or alert for review.
