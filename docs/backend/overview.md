# Backend Overview

The backend of the **PatientRisk Clinical Decision Support System** is an enterprise Python application built with **Django 5.0** and **Django REST Framework (DRF)**, served by the **Daphne ASGI** server.

---

## 1. Key Engineering Attributes

1. **Strict Separation of Concerns:** Business logic, data access, HTTP serialization, and real-time broadcasting are decoupled into discrete layers.
2. **ASGI-First Concurrency:** Daphne executes asynchronous event loops, allowing long-lived WebSockets and high-throughput REST APIs to share a unified port and routing table.
3. **Enterprise Domain Models:** Normalized schema isolating patient master demographics from high-frequency vital sign encounters.
4. **Defensive Clinical Design:** All nullable vitals and biomarkers are sanitized with clinically sound fallbacks to prevent runtime crashes during urgent triage.
