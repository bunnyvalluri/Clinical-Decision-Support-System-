# Declarative Forwarding Rules Guide

## 1. Declarative Architecture & Safety Invariants
Forwarding rules in HealthNova AI are strictly declarative.
- **No Arbitrary Code Execution**: User-defined rules cannot contain Python expressions, Kotlin code, JavaScript, shell commands, or raw SQL queries.
- **Priority-Based Resolution**: Every rule is assigned an integer `priority` (1-1000). Evaluation processes rules in ascending order (lower integer = higher priority).
- **Most Restrictive Policy Wins**: When multiple rules match an event, the most restrictive action is selected:
  $$\text{BLOCK} \succ \text{REVIEW\_REQUIRED} \succ \text{REDACT} \succ \text{ALLOW}$$

## 2. Rule Structure
```json
{
  "name": "Bedside Vitals to Internal Clinical Gateway",
  "event_type": "SMS_RECEIVED",
  "source_filter": "+1555*",
  "content_filter": "\\b(?:bp|vitals|spo2|heart\\s*rate)\\b",
  "classification_policy": "REDACT",
  "destination": "c4b3a210-9876-4321-abcd-ef0123456789",
  "priority": 10,
  "enabled": true
}
```

## 3. Policy Actions
- **`BLOCK`**: Drops the event, logs an audit entry, and ceases further forwarding.
- **`REDACT`**: Sanitizes sensitive tokens, credit cards, or PHI markers before transmission.
- **`REVIEW_REQUIRED`**: Queues the event in `ProcessingStatus.QUEUED` until an authorized clinician signs off.
- **`ALLOW`**: Permits immediate asynchronous transmission to the approved destination.
