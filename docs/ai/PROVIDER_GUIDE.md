# AI Provider Guide & Model Router Configuration

## Provider Abstraction Architecture

The HealthNova AI Platform employs a strict provider abstraction layer. No application code interacts directly with vendor SDKs or hardcoded endpoints. All inference and embedding requests route through the `AIGateway` and concrete implementations of `BaseLLMProvider`.

```
                  ┌──────────────────────┐
                  │    BaseLLMProvider   │
                  └──────────┬───────────┘
                             │
     ┌──────────────┬────────┴────────┬──────────────┬──────────────┐
     │              │                 │              │              │
┌────┴─────┐  ┌─────┴──────┐   ┌──────┴─────┐  ┌─────┴──────┐ ┌─────┴──────┐
│ OpenAI   │  │ Anthropic  │   │   Gemini   │  │ OpenSource │ │ LocalModel │
│ Adapter  │  │  Adapter   │   │  Adapter   │  │   (vLLM)   │ │  (Ollama)  │
└──────────┘  └────────────┘   └────────────┘  └────────────┘ └────────────┘
```

---

## Supported Providers & Model Configurations

| Provider | Supported Models | Primary Clinical Use Case | Latency Profile | Tool Calling | Vision Support | Fallback Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Anthropic** | `claude-3-5-sonnet-20241022` | Clinical reasoning, complex record summarization | Medium (~800ms) | Yes (Native) | Yes | 1 (Primary for Clinical) |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o3-mini` | Multi-agent coordination, structured JSON extraction | Fast (~450ms) | Yes (Strict JSON) | Yes | 2 (Primary for Swarm) |
| **Google** | `gemini-2.0-flash`, `gemini-1.5-pro` | High-throughput guideline retrieval, multimodal check | Very Fast (~250ms) | Yes | Yes | 3 (Primary for Retrieval) |
| **Local / Ollama** | `llama3.3:70b`, `deepseek-r1:14b` | Air-gapped on-premise deployments, de-identified eval | Variable (~1200ms) | Yes | Limited | 4 (Offline / Air-Gapped) |

---

## Model Configuration Schema (`AIModelConfig`)

Configurations are stored in Neon PostgreSQL and cached in Redis. Models are activated or deactivated dynamically without requiring backend restarts:

```python
class AIModelConfig(models.Model):
    provider = models.CharField(max_length=64, choices=ProviderType.choices)
    model_name = models.CharField(max_length=128, unique=True)
    version = models.CharField(max_length=32, default="1.0")
    temperature = models.FloatField(default=0.1)  # Low temperature for clinical determinism
    max_tokens = models.PositiveIntegerField(default=2048)
    context_window = models.PositiveIntegerField(default=128000)
    capabilities = models.JSONField(default=list)  # ["chat", "tools", "vision", "json"]
    supports_tools = models.BooleanField(default=True)
    supports_vision = models.BooleanField(default=False)
    supports_structured_output = models.BooleanField(default=True)
    supports_streaming = models.BooleanField(default=True)
    cost_per_input_token = models.DecimalField(max_digits=10, decimal_places=8, default=0.0)
    cost_per_output_token = models.DecimalField(max_digits=10, decimal_places=8, default=0.0)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
```

---

## Intelligent Model Router & Fallback Chain

The `AIModelRouter` selects the optimal model using multi-criteria optimization:

1. **Task Class**:
   - `CLINICAL_SUMMARY` -> Routes to `claude-3-5-sonnet` (high nuance, low hallucination).
   - `FAST_TRIAGE_QUERY` -> Routes to `gemini-2.0-flash` or `gpt-4o-mini` (low latency).
   - `INFORMATICIST_EVAL` -> Routes to `deepseek-r1` or `o3-mini` (deep reasoning).
2. **Circuit Breaker & Fallback**:
   - If the primary provider triggers 3 consecutive timeouts or 5xx errors in a 60-second window, the circuit breaker opens.
   - Traffic automatically shifts to the designated fallback provider.
   - The router records the exact fallback model used in `AITrace` to ensure total provenance.

---

## Credential & Secret Management Standards

1. **Zero Client Secrets**: Under no circumstances are `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY` included in `NEXT_PUBLIC_*` variables, sent over WebSockets, or rendered in frontend responses.
2. **Server-Side Decouple**: Keys are injected via `python-decouple` from `.env` on the backend server.
3. **Restricted Egress**: Production container network policies disallow outbound connections to unknown IP addresses; outbound connections are constrained to verified provider API hosts.
