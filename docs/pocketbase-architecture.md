# PocketBase Architectural Integration

## Architecture Overview

The CDSS architecture establishes clear boundaries between clinical infrastructure and auxiliary services.

```text
               +----------------------------------+
               |        Next.js Frontend          |
               |      (Port 3000 / Edge CDN)      |
               +--------+----------------+--------+
                        |                |
         Clinical APIs  |                | Auxiliary SDK
        (Auth, Records, |                | (UI state,
          Predictions)  |                |  Announcements)
                        v                v
          +-------------------+    +-------------------+
          | Django ASGI (8000)|    | PocketBase (8090) |
          +---------+---------+    +---------+---------+
                    |                        |
         +----------+---------+              |
         |                    |              v
         v                    v        +-----------+
  +-------------+      +-------------+ |  SQLite   |
  |    Neon     |      |    Redis    | | (pb_data) |
  | PostgreSQL  |      |   Cluster   | +-----------+
  +-------------+      +------+------+
                              |
                     +--------+--------+
                     |                 |
                     v                 v
               +-----------+     +-----------+
               |  Celery   |     |  Django   |
               |  Workers  |     | Channels  |
               +-----+-----+     +-----------+
                     |
                     v
               +-----------+
               |  ML ONNX  |
               |  Engines  |
               +-----------+
```

## System Separation
1. **Critical Clinical Path**:
   - Next.js -> Django REST API -> Neon PostgreSQL -> ML Pipeline -> Predictions -> Django Channels/Redis -> Next.js.
2. **Auxiliary Path**:
   - Next.js -> PocketBase JS SDK -> PocketBase (`:8090`) -> SQLite (`pb_data`).

Both paths remain completely isolated. PocketBase does not talk to Neon PostgreSQL or Django.
