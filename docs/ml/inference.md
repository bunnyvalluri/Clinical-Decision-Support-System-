# Runtime Inference Engine

The runtime inference engine in `services/prediction_service.py` executes predictions in sub-10 milliseconds.

---

## 1. Runtime Flow

1. Patient ID is received via REST API or WebSocket.
2. Latest clinical encounter vitals are fetched from Neon PostgreSQL.
3. Vitals dictionary is transformed through the active pipeline in memory.
4. `predict_proba()` calculates the risk probability.
5. Risk level is assigned based on clinical thresholds.
6. Record is saved to PostgreSQL and dispatched to Redis.
