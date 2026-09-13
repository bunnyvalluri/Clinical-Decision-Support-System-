# WebSocket Handshake Security

WebSockets cannot send custom HTTP headers during initial browser handshakes.
- **Solution:** JWT is transmitted as a URL query parameter (`?token=...`).
- **Validation:** ASGI middleware parses the query string, verifies signature and expiration, and rejects invalid connections with HTTP 403 / close code 4003 before establishing channel state.
