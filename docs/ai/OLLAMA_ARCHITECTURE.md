# Ollama Architecture & Topology

## 1. System Topology

```
+---------------------------------------------------------------------------------------------------+
|                                      FRONTEND (Next.js 14)                                        |
|  - OllamaHealthBadge                                                                              |
|  - OllamaModelManager                                                                             |
|  - ClinicalPredictionExplainer                                                                    |
+---------------------------------------------------------------------------------------------------+
                                                  | HTTPS / WSS
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 BACKEND (Django REST Framework)                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | RBAC & Security Middleware (Permission Checks, PHI Sanitization, Prompt Injection Defenses) |  |
|  +---------------------------------------------------------------------------------------------+  |
|  | AI Gateway & Model Router (`backend/ai/gateway/model_router.py`)                            |  |
|  |  - Directs sensitive clinical queries to OllamaProvider                                     |  |
|  |  - Enforces model approval status & circuit breaker                                         |  |
|  +---------------------------------------------------------------------------------------------+  |
|  | Ollama Integration Core (`backend/integrations/ollama/`)                                    |  |
|  |  - client.py (Native + OpenAI endpoints, circuit breaker, exponential backoff)              |  |
|  |  - structured_output.py (JSON Schema enforcement)                                           |  |
|  |  - embeddings.py (Vector generation & dimension check)                                      |  |
|  |  - tool_calling.py (Controlled tool dispatch)                                               |  |
|  +---------------------------------------------------------------------------------------------+  |
|  | Django Channels (WebSocket streaming chunks to authenticated frontend clients)               |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
             |                                       |                                    |
             v HTTP (Internal Bridge)                v SQL (Authoritative)                v Redis pub/sub
+-------------------------+             +--------------------------+             +-------------------+
|  OLLAMA INFERENCE CORE  |             |     NEON POSTGRESQL      |             |   REDIS / CELERY  |
|  - ollama/ollama:0.5.12 |             | - LLMModelRegistry       |             | - Model sync      |
|  - Port: 11434 (Private)|             | - AISession / AIRequest  |             | - Batch embedding |
|  - Volume: ollama_data  |             | - EmbeddingRegistry      |             | - Async benchmark |
+-------------------------+             +--------------------------+             +-------------------+
```

## 2. Network Isolation Principles
1. Ollama is **never** published to external DNS, public IP, or public reverse proxy ingress.
2. Only backend containers (`backend`, `celery_worker`) have access to `http://ollama:11434`.
3. Client web browsers communicate exclusively with `/api/v1/ai/providers/ollama/` using JWT authentication and clinician session tokens.

## 3. Storage Architecture
- Model weights are stored in the persistent Docker volume `ollama_data` mounted at `/root/.ollama`.
- Metadata, operational audit logs, benchmark metrics, and execution traces are recorded exclusively in Neon PostgreSQL.
