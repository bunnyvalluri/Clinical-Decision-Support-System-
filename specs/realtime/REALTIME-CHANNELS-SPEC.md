# Real-Time Channels Specification: Django Channels & WebSockets

**Spec ID**: `RT-SPEC-001`  
**Domain**: Real-Time Alerts, Vitals Streaming, & WebSocket Governance  
**Status**: `CONVERGED`  
**Infrastructure**: Django Channels, Daphne ASGI, Redis Channel Layer  

---

## 1. Real-Time Transaction Synchronization Rule

> [!IMPORTANT]
> **Commit-First Invariant**:
> WebSockets MUST NEVER broadcast uncommitted, speculative, or in-flight data.
> All broadcasts to Redis channel groups must execute inside `transaction.on_commit()`:
> ```python
> from django.db import transaction
> from asgiref.sync import async_to_sync
> from channels.layers import get_channel_layer
>
> def save_and_notify_prediction(prediction):
>     with transaction.atomic():
>         prediction.save()
>         channel_layer = get_channel_layer()
>         transaction.on_commit(lambda: async_to_sync(channel_layer.group_send)(
>             f"patient_{prediction.patient_id}",
>             {"type": "prediction.alert", "payload": serialize(prediction)}
>         ))
> ```

---

## 2. Channel Routes & Topic Authorization

1. **Route Structure**:
   - `/ws/doctor/alerts/`: Global authorized alert stream for attending physicians.
   - `/ws/nurse/triage/`: Real-time ward triage updates.
   - `/ws/patient/{patient_id}/`: Patient-specific vital stream (Restricted to patient owner or assigned provider).
2. **Connection Security**:
   - Connection handshake validates JWT bearer token.
   - Unauthorized connections are rejected immediately with close code 4403.
   - Per-group message filtering prevents cross-tenant or cross-patient event leakage.

---

## 3. Resilience & Backpressure

1. **Client Reconnect**:
   - Frontend client implements exponential backoff with random jitter (1s to 30s).
   - If WebSocket remains disconnected > 10 seconds, client UI seamlessly switches to REST polling every 15 seconds.
