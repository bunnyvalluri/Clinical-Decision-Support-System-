# Frontend Setup & Local Development

This guide explains how to install dependencies, configure environment variables, and run the Next.js frontend application.

---

## 1. Prerequisites

- **Node.js:** `v20.x` or `v22.x` (LTS)
- **Package Manager:** `npm` (v10+)
- **Backend API:** Daphne ASGI server running on `http://localhost:8000`

---

## 2. Installation Steps

1. Navigate to the frontend directory:
   ```bash
   cd c:/4-1/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   NEXT_PUBLIC_APP_NAME="PatientRisk CDSS"
   ```
4. Start development server with Turbopack:
   ```bash
   npm run dev
   ```
5. Open browser at `http://localhost:3000`.

---

## 3. Production Build & Validation

To compile the optimized standalone production build:
```bash
# Type check without emitting files
npm run type-check

# Compile production bundle
npm run build

# Start production standalone runner
npm run start
```
