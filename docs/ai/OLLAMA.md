# Ollama Local LLM Integration Overview

## 1. Executive Summary
This document defines the integration of **Ollama** (v0.5.12) as the local, self-hosted LLM inference runtime within the Clinical Decision Support System (CDSS). Ollama enables on-premises, privacy-first inference for clinical note summarization, risk score explanation, triage synthesis, and vector embeddings without routing Protected Health Information (PHI) to external cloud APIs.

## 2. Core Operational Pillars
1. **Self-Hosted Privacy**: All inference requests containing patient context or sensitive clinical attributes execute exclusively within the internal infrastructure. Zero PHI egress to public endpoints.
2. **Neon PostgreSQL Authority**: All sessions, prompts, model metadata, latency records, token metrics, and clinician approval audits persist immutably in Neon PostgreSQL.
3. **Deterministic Core Preservation**: Classical ML models (SVM, Random Forest, AdaBoost) generate clinical risk scores and TreeSHAP values. Ollama provides human-readable explanations referencing immutable prediction IDs.
4. **Resilience & Circuit Breaking**: If Ollama experiences downtime or resource contention, classical ML predictions and core EHR features remain 100% operational.
5. **Strict Human Sign-off**: Every AI-generated clinical narrative requires clinician review and cryptographic signature before clinical entry.

## 3. High-Level Capabilities
- **Local Chat & Completions**: Streaming and batch generation with configurable temperature, top_p, top_k, and seed.
- **Local Embeddings**: High-throughput document and guideline vectorization via `nomic-embed-text` or `bge-m3`.
- **Structured JSON Output**: Schema-enforced generation using JSON schemas for triage summaries and risk explanations.
- **Controlled Tool Calling**: Tool call invocation validated by RBAC permissions and execution guardrails.
- **Vision Inference**: Medical document and chart OCR assistance with strict non-diagnostic disclaimers.
