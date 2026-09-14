# Frontend Environment & Configuration Guide

## Overview

The Next.js frontend is configured via environment variables and `next.config.ts`. This document outlines the configuration parameters required for local development, staging, and production environments.

---

## 1. Environment Variables (`.env.local` / `.env`)

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL | `http://localhost:8000/api/v1` | Base URL for Django REST Framework backend API. |
| `NEXT_PUBLIC_WS_URL` | URL | `ws://localhost:8000/ws` | Base WebSocket endpoint for Django Channels. |
| `NEXT_PUBLIC_APP_ENV` | String | `development` | Environment mode (`development`, `staging`, `production`). |
| `NEXT_PUBLIC_APP_NAME` | String | `PatientRisk CDSS` | Application name displayed in titles and navigation headers. |
| `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK` | Boolean | `true` | When `true`, retains local seed data if backend API is temporarily offline. |

---

## 2. Next.js Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;
```

### Turbopack Root Isolation
Setting `turbopack.root = path.resolve(__dirname)` ensures Next.js resolves project boundaries directly to `frontend/`, eliminating workspace lockfile inference warnings.
