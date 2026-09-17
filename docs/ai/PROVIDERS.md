# LLM Provider Abstraction & Fallback Governance

## 1. Provider Routing Philosophy
HealthNova AI enforces a privacy-first, on-premise priority model:
- **Primary Inference Provider**: Local Ollama instance running fine-tuned clinical models (`medllama3:latest`).
- **External Cloud Provider**: Fast cloud models (Groq / Gemini) used strictly as secondary fallbacks.

```
                    +-----------------------------+
                    |    Agent Execution Call     |
                    +--------------+--------------+
                                   |
                                   v
                    +-----------------------------+
                    |      Data Classification    |
                    +--------------+--------------+
                                   |
                  +----------------+----------------+
                  |                                 |
         [Contains PHI / Sensitive]       [Public / Low Sensitivity]
                  |                                 |
                  v                                 v
        +-------------------+             +-------------------+
        | Pin to Local      |             | Ollama Primary    |
        | Ollama Cluster    |             | with Cloud        |
        +---------+---------+             | Fallback Allowed  |
                  |                       +---------+---------+
         (If Error/Down)                            |
                  |                                 v
                  v                       +-------------------+
        +-------------------+             | External Provider |
        | Safe Degraded     |             | (Groq / Gemini)   |
        | Mode (No Egress)  |             +-------------------+
        +-------------------+
```

## 2. PHI Firewall
Before any payload is submitted to the provider router:
1. If the request context is marked with `DataClassification.PHI`, `DataClassification.HIGHLY_SENSITIVE`, or `DataClassification.AUTHENTICATION_SECRET`, routing to external cloud APIs is blocked.
2. If the local Ollama provider is unreachable or times out, the system will NOT fail over to external cloud. Instead, it emits a `safe_degraded_stop` response:
   > *"Local clinical inference service is temporarily degraded. Under healthcare safety invariants, patient data cannot be routed to external cloud models. Please refer to standard clinical records workflow."*

## 3. Circuit Breaking & Telemetry
Every provider call records:
- `prompt_tokens`, `completion_tokens`, `total_tokens`
- Exact round-trip duration in `latency_ms`
- Fallback transition details in `AgentProviderExecution`
