# Painting Store UI

React frontend for the Painting E-commerce API, built from [`frontend-spec.md`](../frontend-spec.md).

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui-style components (Radix), React Router, Fetch, Vitest + React Testing Library.

## Run locally

Prerequisites: Node.js 20+ (LTS) and the Spring Boot backend running on `http://localhost:8080`.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

In development, Vite proxies `/api` to `http://localhost:8080`, so the backend does not need CORS for local work. Point the proxy elsewhere with `API_PROXY_TARGET=http://host:port npm run dev`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the test suite once |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |

## Environment variables

Copy `.env.example` to `.env.local` and adjust.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty (same origin / dev proxy) | Backend origin for production builds, e.g. `https://api.example.com`. The backend must allow the frontend origin via CORS. |
| `VITE_ENABLE_MUTATIONS` | `true` | Set to `false` to hide create/edit/delete screens and controls. |

`VITE_` variables are embedded in the client bundle, so never put secrets in them.

## Routes

| Route | Screen |
| --- | --- |
| `/paintings` | Catalogue with title search (`?title=` in the URL) |
| `/paintings/new` | Create painting |
| `/paintings/:id` | Painting details, with edit and delete |
| `/paintings/:id/edit` | Edit painting |
| `*` | Not found |

## API contract (as implemented in `PaintingController`)

- `GET /api/paintings[?title=]` returns a raw JSON array; title search is partial and case-insensitive.
- `GET /api/paintings/{id}` returns `404` for unknown IDs.
- `POST` returns `201` with the created painting, `PUT` returns `200` with the updated painting, `DELETE` returns `204`.
- `price` must be at least `0.01`; `stock` is a non-negative integer; `description` and `imageUrl` may be `null`.

Every response is validated at runtime (`src/validation/paintingValidation.ts`) before it is used; unexpected shapes show an error instead of rendering bad data. If the backend adds the spec's `fieldErrors` object to `400` responses, the form shows those messages next to the matching fields.

## Project structure

```text
src/
  app/          App, routes
  api/          http.ts (fetch wrapper, error mapping), paintingsApi.ts
  components/   PaintingCard, PaintingForm, states, ui/ (shadcn-style primitives)
  pages/        List, details, create, edit, not found
  validation/   Runtime type guards and form validation
  types/        Painting, PaintingInput
  lib/          Config, formatting, small hooks
```
