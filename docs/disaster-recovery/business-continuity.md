# HealthNova AI CDSS — Business Continuity & Clinical Safety During Outages

## 1. Clinical Safety Principles During Degraded States

```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. NEVER fabricate patient risk scores, diagnoses, or prescriptions.       ║
║ 2. If inference fails, render: 'Prediction service unavailable'.           ║
║ 3. Bedside clinicians must be clearly notified of system degradation.      ║
║ 4. Clinical core operations continue uninterrupted if AI/Search is offline. ║
║ 5. Zero unredacted PHI is dispatched to public endpoints during fallbacks. ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. 10-Subsystem Continuity Matrix

| Subsystem | Criticality | Fallback Mechanism | Degraded Operational Behavior | Recovery Target (RTO) | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Neon PostgreSQL** | Tier 0 (Critical) | Promote PITR zero-copy recovery branch; local read-only safety cache | Service blocks unsafe writes. Critical bedside alerts broadcast to nurses. | < 30 seconds (compute provision) | Database Reliability / DBA |
| **2. Redis Broker/Cache** | Tier 1 (High) | Cache-aside direct database queries; synchronous task bypass | Realtime WebSockets degrade to periodic HTTP polling. | < 2 minutes | Infrastructure Team |
| **3. AI Gateway / Ollama** | Tier 2 (Optional) | Deterministic bedside scoring rules (qSOFA, NEWS2) | UI displays `"Prediction service unavailable"`. Clinical records remain fully editable. | < 5 minutes | AI Engineering |
| **4. ML Prediction Engine** | Tier 1 (High) | Revert to previous approved model artifact in Model Registry | Risk tier inference pauses; bedside staff alerted to use manual assessment protocols. | < 3 minutes | MLOps / ML Engineer |
| **5. Meilisearch** | Tier 2 (Medium) | Direct SQL matching (`ILIKE` / PostgreSQL full-text search) | Search results return via standard relational queries without typo-tolerance. | < 5 minutes | Search Platform |
| **6. Coolify Control Plane** | Tier 2 (Medium) | Direct Docker Compose / host VM CLI management via SSH | Existing deployed containers run uninterrupted; new deployments queued. | < 10 minutes | DevOps SRE |
| **7. GitHub CI/CD** | Tier 3 (Operational) | Mirror repository on GitLab / local branch deployment | Automated PR testing paused; staging builds dispatched via local script. | < 15 minutes | Release Engineering |
| **8. GitLab CI/CD** | Tier 3 (Operational) | Direct Docker image build on staging server | Secondary validation pipelines paused. | < 15 minutes | Release Engineering |
| **9. Container Registry** | Tier 2 (High) | Cached local Docker host images (immutable commit SHA / digest) | Rollbacks constrained to images cached on the local Docker daemon. | < 5 minutes | DevOps SRE |
| **10. External APIs / Firecrawl** | Tier 3 (Low) | Authoritative clinical guidelines cached in Neon database | Evidence cards display `"Source unavailable"`; clinical prediction unblocked. | < 30 minutes | Medical Informatics |

---

## 3. Safe Degraded Mode Visual Indicators

When any subsystem enters degraded mode, the HealthNova AI frontend dynamically displays high-contrast, white-only status banners:
- **AI Degradation**: Amber warning badge reading `AI Assistant Offline — Bedside Core Active`.
- **Search Degradation**: Slate badge reading `Search Operating in Relational Database Mode`.
- **WebSocket Degradation**: Amber indicator reading `Realtime Disconnected — Polling Every 15s`.
- **Inference Failure**: The risk gauge displays a neutral slate card with the exact text:
  > **Prediction service unavailable**  
  > *Please consult standard bedside clinical protocols directly. System inference paused.*
