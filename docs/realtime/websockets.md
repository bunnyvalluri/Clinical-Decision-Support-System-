# WebSocket Connection Lifecycle

```
[Browser Client]                    [Nginx Proxy]                   [Daphne ASGI]
       │                                  │                               │
       │─── GET /ws/dashboard/?token= ───>│─── Upgrade $http_upgrade ────>│
       │                                  │                               │─── Authenticate JWT
       │                                  │                               │─── Join Redis Group
       │<── 101 Switching Protocols ──────│<── 101 Switching Protocols ───│
       │                                  │                               │
       │<=================== Persistent Full-Duplex Channel =============>│
       │                                  │                               │
       │─── Ping Frame ──────────────────>│──────────────────────────────>│
       │<── Pong Frame ───────────────────│<──────────────────────────────│
```
