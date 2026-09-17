# AI Memory Governance & Privacy Protection

## Memory Architecture Principles

Unlike consumer chatbots that freely persist unrestricted conversation history and extract unstructured user facts, healthcare AI memory is subject to stringent HIPAA and GDPR privacy regulations.

1. **Strict Namespace Partitioning**: Memory is partitioned into isolated namespaces. An agent operating in one namespace cannot read or infer state from another.
2. **ZERO PHI in General Memory**: Patient identifiers (name, MRN, phone, address, SSN, biometric data) are strictly prohibited from being persisted in generic agent memory or shared embeddings.
3. **Deterministic TTL Expiration**: All dynamic memory entries carry mandatory Time-To-Live (TTL) timestamps and are automatically purged upon expiry.
4. **No Autonomous Memory Promotion**: An LLM agent cannot arbitrarily write user assertions into permanent system truth without explicit verification.

---

## Memory Namespaces

| Namespace | Intended Purpose | Permitted Content | PHI Permitted? | Default TTL |
| :--- | :--- | :--- | :--- | :--- |
| `user_preferences` | UI & formatting settings | Language, preferred view, font size | **NO** | 365 Days |
| `clinician_workflow`| Clinician convenience | Preferred review templates, filter presets | **NO** | 90 Days |
| `agent_coordination`| Temporary multi-agent state | Subtask IDs, intermediate tool output IDs | **NO** | 1 Hour |
| `project_knowledge` | Institutional documentation | Guidelines, system runbooks, schema versions | **NO** | Persistent |
| `ai_evaluations` | Benchmark results | Metric outputs, latency scores | **NO** | 30 Days |

---

## Memory Entity Schema (`AIMemory`)

```python
class AIMemory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    namespace = models.CharField(max_length=32, choices=Namespace.choices, db_index=True)
    key = models.CharField(max_length=255, db_index=True)
    value = models.JSONField(default=dict)
    classification = models.CharField(max_length=32, default="LOW_SENSITIVITY")
    provenance = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "ai_memories"
        unique_together = ("owner_user", "namespace", "key")
```

---

## Automated Memory Sanitization & Purging

- **Daily Celery Task**: `celery_tasks.ai_tasks.purge_expired_ai_memories` executes every 24 hours to delete records where `expires_at < now()`.
- **Pre-Write Scanner**: Before writing any record into `AIMemory`, the `AISafetyEngine` scans the payload with regex and entity recognition to verify zero presence of Social Security Numbers, MRNs, phone numbers, or email addresses.
