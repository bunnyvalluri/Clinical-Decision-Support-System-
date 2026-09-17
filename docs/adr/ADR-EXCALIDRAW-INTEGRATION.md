# ADR-EXCALIDRAW-INTEGRATION: Excalidraw Clinical Visualization & Architecture Platform

> **Status:** Accepted  
> **Date:** 2026-09-17  
> **Decision Maker:** HealthNova AI Architectural Review Board  
> **Invariants Enforced:** Non-authoritative auxiliary status, Neon PostgreSQL single source of truth, Zero-PHI vector leakage, Hospital-grade light theme.

---

## 1. Context and Problem Statement

Clinicians, nurses, informaticists, and health system engineers require dynamic diagramming capabilities to map care pathways, triage protocols, multidisciplinary care plans, ML pipelines, and incident response runbooks.
Prior solutions either required external unvetted SaaS tools (violating HIPAA/PHI boundaries) or lacked interactive collaborative canvas features.

## 2. Decision

Integrate `@excalidraw/excalidraw` directly into the Next.js 16 (React 19) frontend, backed by Django REST Framework and Django Channels (WebSockets) connected to Neon PostgreSQL and Redis.

### Architectural Choices:
1. **Direct In-App Embedding with Dynamic Import**:
   Excalidraw relies heavily on client-side browser DOM, canvas, and WebGL APIs. We isolate the whiteboard editor into client-only dynamic components (`ssr: false`) in Next.js.
2. **Fixed Light/Hospital Theme**:
   Disable built-in dark theme toggle (`theme="light"` enforced), matching the high-visibility, light-background hospital clinical UI design standard.
3. **Django Channels Collaboration over Firebase**:
   Instead of introducing external cloud stores, multi-user cursor tracking and element updates stream via existing Django Channels and Redis groups, subject to object-level RBAC.
4. **Neon PostgreSQL as Single Source of Truth**:
   All persisted whiteboards, versions, assets, and audit trails reside in Neon PostgreSQL.
5. **Non-Authoritative Risk Invariant**:
   Diagram annotations are strictly non-authoritative; authoritative ML predictions and clinical diagnoses reside solely in the core Django ML & clinical engines.

## 3. Consequences

- **Positive**: Complete data sovereignty, HIPAA-compliant collaboration, zero external vendor dependencies for real-time sync, full versioning and auditability.
- **Trade-offs**: Requires custom server-side validation for Excalidraw JSON payloads and secret/PHI scanning prior to persistence.
