# WebSocket Channels Testing

Tests in `tests/test_websockets.py` utilize Channels `WebsocketCommunicator`:
- Asserts successful connection with valid JWT query token.
- Asserts rejection of unauthenticated or expired tokens.
- Verifies broadcast reception on `dashboard` channel groups.
