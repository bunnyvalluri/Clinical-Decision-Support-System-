# Ollama Version Pinning & Runtime Specification

## Pinned Version
- **Ollama Version**: `0.5.12`
- **Release Reference**: Official GitHub release `v0.5.12` (https://github.com/ollama/ollama/releases/tag/v0.5.12)
- **Official Docker Image**: `ollama/ollama:0.5.12`

## Architectural Context
Ollama acts strictly as the **Self-Hosted / Local LLM Inference Layer** in this Clinical Decision Support System (CDSS).
- Sole Authoritative State Store: Neon PostgreSQL
- Authoritative RBAC / Access Control: Django REST Framework
- Primary Prediction Engine: Classical scikit-learn models (SVM, Random Forest, AdaBoost) with TreeSHAP
- Ollama Role: Local LLM inference, clinical explanation synthesis, medical report summarization, and local embeddings generation.

## Network & Ingress Topology
- **Private Network Only**: Ollama container runs inside an isolated Docker/Coolify internal bridge network.
- **Port**: `11434` (Internal only).
- **Public Ingress**: Strictly FORBIDDEN. Direct browser access or CORS exposure is disabled. All client interactions pass through Django REST Framework endpoints (`/api/v1/ai/providers/ollama/`).

## Hardware Profiles & Requirements

| Profile | Target Hardware | Recommended Models | Max Context Window | Quantization |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Only (Development)** | 8-core x86_64, 16GB RAM | `llama3.2:1b`, `qwen2.5:3b`, `nomic-embed-text` | 4,096 | Q4_K_M |
| **Standard Inference (16GB VRAM)** | 1x NVIDIA RTX 4080 / T4, 32GB RAM | `llama3.3:8b-instruct-q4_K_M`, `mistral:7b-instruct-v0.3-q4_K_M` | 8,192 | Q4_K_M |
| **Enterprise Clinical (24GB-48GB VRAM)** | 1x-2x NVIDIA A10G / L4 / A5000, 64GB RAM | `llama3.3:70b-instruct-q4_K_M`, `qwen2.5:32b`, `deepseek-r1:14b` | 16,384 | Q4_K_M / Q8_0 |
| **Embedding Service** | CPU or 4GB VRAM | `nomic-embed-text:latest`, `bge-m3:latest` | 8,192 | F16 / Q8_0 |

## Environment Configuration Variables
```env
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_REQUEST_TIMEOUT=60
OLLAMA_CONNECT_TIMEOUT=5
OLLAMA_MAX_CONCURRENCY=8
OLLAMA_KEEP_ALIVE=15m
OLLAMA_DEFAULT_CHAT_MODEL=llama3.3:8b-instruct-q4_K_M
OLLAMA_DEFAULT_EMBEDDING_MODEL=nomic-embed-text:latest
OLLAMA_TEMPERATURE=0.1
OLLAMA_SEED=42
```
