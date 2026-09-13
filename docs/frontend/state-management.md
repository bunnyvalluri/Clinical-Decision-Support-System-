# State Management

The frontend utilizes **Zustand** for lightweight, predictable, and boilerplate-free state management.

---

## 1. Store Inventory

### 1.1 `useAuthStore` (`features/auth/authStore.ts`)
Manages authentication state, user metadata, and active role:
- `user`: Authenticated user profile (`id`, `email`, `role`, `department`).
- `tokens`: Access and refresh JWT strings.
- `loginAsRole(role)`: Instantly switches active demo clinician persona (`DOCTOR`, `NURSE`, `ADMIN`).
- `logout()`: Clears tokens, terminates WebSocket connections, and redirects to `/login`.

### 1.2 `useClinicalStore` (`features/clinical/clinicalStore.ts`)
Manages active clinical domain state and real-time event updates:
- `predictions`: Array of recent prediction summaries.
- `notifications`: Unread and historical triage notifications.
- `unreadAlertsCount`: Counter for emergency risk badges.
- `handleWebSocketPrediction(payload)`: Optimistically inserts incoming prediction at top of feed without page reload.
- `handleWebSocketAlert(payload)`: Pushes urgent alert notification to state.
- `handleWebSocketTask(payload)`: Updates background report compilation progress (0% -> 100%).
