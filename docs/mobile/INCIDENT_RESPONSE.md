# Incident Response & Emergency Kill Switch

## 1. Triggering Scenarios
The Emergency Kill Switch should be activated immediately if:
- A registered mobile device is reported lost, compromised, or stolen.
- An unauthorized forwarding destination or unapproved third-party URL is discovered.
- Sensitive information (unredacted PHI or secrets) is detected in forwarding queues.
- An active forwarding storm or credential replay attack is observed.

## 2. Kill Switch Scopes
IT Administrators can execute targeted or global halts via `/api/v1/mobile/kill-switch/`:
1. **`GLOBAL`**: Instantly freezes all mobile event forwarding system-wide.
2. **`DESTINATION`**: Halts all outgoing traffic to a specific endpoint.
3. **`DEVICE`**: Disables event transmission for a single mobile device.
4. **`RULE`**: Disables a specific declarative rule.
5. **`USER`**: Halts all forwarding associated with a specific user account.

## 3. Incident Audit Preservation
Activating an Emergency Kill Switch:
- Stops active Celery delivery and transitions in-flight events to `ProcessingStatus.CANCELLED`.
- **Never purges historical audit records or DeliveryReceipts**.
- Emits a real-time alert over Django Channels to all connected IT Administrator dashboards.
