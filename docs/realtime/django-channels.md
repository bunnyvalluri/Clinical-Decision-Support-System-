# Django Channels Consumers

WebSocket consumer implementations reside in `backend/channels_app/consumers.py`.

---

## 1. Consumer Catalog

### 1.1 `DashboardConsumer`
- Handles connections to `/ws/dashboard/`.
- Joins the `dashboard` broadcast group on connect.
- Forwards `prediction_created`, `risk_alert`, and `task_status_updated` events to connected browser sessions.
