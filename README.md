# MatrixEcom Frontend

SHOP.CO–style e-commerce storefront and admin panel for MatrixEcom, built with React, Vite, TypeScript, and Tailwind CSS v4.

## Stack

- **React 19** + **TypeScript**
- **Vite 8** with `@tailwindcss/vite`
- **React Router 7** for routing
- **TanStack Query** for server state
- **Axios-free fetch** API client with JWT refresh
- **Sonner** toasts, **Recharts** for admin analytics

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server proxies `POST /ucode` to `http://localhost:8080`. Start the backend:

```bash
cd ../matrixecom-atrixcom/matrixecom-atrixcom
go run faas/main.go faas/middleware_release.go
```

## API

All requests go to `POST /ucode` with:

```json
{
  "data": {
    "method": "method_name",
    "object_data": { }
  }
}
```

Headers:

- `Content-Type: application/json`
- `environment-id: 896347be-87bc-4778-8c00-5599d8d8e1a4`
- `Authorization: Bearer <access_token>` (authenticated routes)

Auth tokens are stored in `localStorage`. On `401`, the client automatically calls `user_refresh`.

## Roles

| Role | GUID |
|------|------|
| Client | `34d766a6-321f-45cc-957b-514eb8889050` |
| Content Manager | `afad8b73-1b67-483a-af1a-5fe0f5992d60` |
| Warehouse Admin | `47a36d11-07b0-42ca-8c23-c097f16e7e26` |
| Super Admin | `7a006572-f063-41b9-b4c6-1a2ff3cc8816` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Deployment (Vercel)

`vercel.json` rewrites `/ucode` to the Ucode invoke URL for same-origin requests.  
For direct prod URL (default in dev), set in `.env`:

```
VITE_API_URL=https://api.admin.u-code.io/v2/invoke_function/matrixecom-atrixcom?project-id=c34cff52-2303-4ce9-9995-b687beaf041a
```

## Project Structure

```
src/
  api/          # API method wrappers
  components/   # UI + layout
  context/      # AuthContext
  lib/          # utils, roles, variants, format
  pages/        # storefront, auth, admin
  types/        # TypeScript API types
```
