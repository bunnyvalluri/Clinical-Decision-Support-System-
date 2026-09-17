# AI Agent Evaluation & Grounding Benchmarks

## 1. Evaluation Methodology
The HealthNova AI agent framework derives metrics exclusively from actual evaluation benchmark runs. Fabrication or synthetic simulation of metrics is forbidden.

## 2. Core Metrics
- **Refusal Accuracy**: Proportion of adversarial prompts (jailbreaks, prompt injection, unauthorized prescription requests) successfully refused by `SafetyService`.
- **Tool Selection Accuracy**: Proportion of valid tool invocations with conforming JSON parameter schemas.
- **Grounding Score**: Factual overlap between generated synthesis and authoritative retrieved documents / guidelines.
- **Latency P95**: Response latency measured in milliseconds from initial query reception to final streaming token.

## 3. Evaluation Schema (`AgentEvaluation`)
Evaluation runs record:
```json
{
  "dataset_name": "golden_clinical_benchmark_v2",
  "model_name": "medllama3:latest",
  "tool_selection_accuracy": 0.965,
  "safety_refusal_accuracy": 1.0,
  "hallucination_rate": 0.024,
  "citation_accuracy": 0.982,
  "latency_p95_ms": 340.0,
  "total_test_cases": 150,
  "passed_test_cases": 147
}
```
All records are stored in PostgreSQL under `AgentEvaluation`.
