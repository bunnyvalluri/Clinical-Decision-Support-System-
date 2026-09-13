# API Integration & HTTP Client

The frontend communicates with the Django REST Framework API through a centralized Axios client configured with automatic JWT rotation and error normalization.

---

## 1. Axios Client Configuration (`lib/api.ts`)

```typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

---

## 2. Request & Response Interceptors

### Request Interceptor
Automatically injects the Bearer JWT token into the `Authorization` header if available in `authStore`.

### Response Interceptor (Auto-Refresh)
When an API call returns `401 Unauthorized`:
1. The interceptor pauses pending requests.
2. Dispatches a token refresh request to `POST /api/v1/auth/token/refresh/`.
3. If successful, updates the access token in `authStore` and retries the original request.
4. If refresh fails, flushes the auth store and redirects the user to `/login`.
