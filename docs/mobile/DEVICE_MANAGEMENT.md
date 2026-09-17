# Mobile Device Lifecycle & Management

## 1. Device Registration States
Mobile devices transition through a formal security lifecycle:
```
PENDING ──(Admin Approval)──► ACTIVE ──(Compromise/Logout)──► REVOKED
   │                             │
   │                             ├──(Temporary Inactive)──► SUSPENDED
   │                             ├──(Hardware Loss)──────► LOST
   │                             └──(Retirement)─────────► DECOMMISSIONED
   └──(Rejection)────────────► REVOKED
```

- **`PENDING`**: Device registered but awaiting verification. Cannot transmit events.
- **`ACTIVE`**: Device authorized to transmit normalized events.
- **`SUSPENDED`**: Temporarily paused (e.g. during security audit).
- **`REVOKED`**: Permanently disabled. Incoming API requests immediately rejected with HTTP 403.
- **`LOST`**: Device flagged as stolen or misplaced; credentials purged.
- **`DECOMMISSIONED`**: Hardware decommissioned from healthcare network.

## 2. Hardware Keystore Management
Each Android client generates a private/public key pair inside the hardware-backed Android Keystore:
- **Private Key**: Never leaves device hardware. Never logged or transmitted.
- **Public Key**: Uploaded to Django upon device registration.
- **Signing**: Used to compute HMAC-SHA256 request signatures with millisecond timestamp and single-use nonce.

## 3. Immediate Device Revocation
Patients can revoke their own devices from the portal (`/user/devices`). IT Administrators can revoke any device from `/admin/forwarding`. Revocation immediately invalidates active WebSockets and blocks further event transmission.
