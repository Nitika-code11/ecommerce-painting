# Painting Store

[![CI](https://github.com/Nitika-code11/ecommerce-painting/actions/workflows/ci.yml/badge.svg)](https://github.com/Nitika-code11/ecommerce-painting/actions/workflows/ci.yml)

A full-stack catalogue for an online painting store: a Spring Boot REST API and a React single-page app.

| | |
| --- | --- |
| **Backend** | Java 17, Spring Boot 3.3, Spring Data JPA, Bean Validation, H2 (in-memory), Maven |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Vitest + Testing Library |
| **CI** | GitHub Actions: backend `verify` and frontend test + build on every push and pull request |

## Quick start

Prerequisites: JDK 17+ and Node.js 20+ (the Maven wrapper downloads Maven itself).

```bash
# 1. API on http://localhost:8080
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 2. UI on http://localhost:5173 (in a second terminal)
cd frontend
npm install
npm run dev
```

The default `dev` profile loads ten public-domain paintings (images from Wikimedia Commons), so the catalogue is populated on first start. Data lives in memory and resets on every restart.

## Architecture

```text
Browser ──► React SPA (Vite) ──/api──► Spring Boot ──► H2 (dev)
            validates responses        controller → service → repository
            at runtime                 DTOs at the edge, JPA entity inside
```

- **Layering:** `PaintingController` (HTTP) → `PaintingService` (use cases, transactions) → `PaintingRepository` (Spring Data JPA).
- **API contract:** requests and responses are DTOs (`PaintingRequest`, `PaintingResponse`), so the JSON shape is independent of the database schema. Validation lives on the request DTO.
- **Errors:** every failure, including framework errors such as `405` or malformed JSON, returns the same `ApiError` body (see below). Stack traces are never exposed.
- **Frontend safety:** every API response is checked at runtime before it is rendered, and `400` field errors are shown next to the matching form fields.
- **Dev networking:** Vite proxies `/api` to the backend; the backend also allows the configured origins via CORS for deployed setups.

## API

Base path: `/api/paintings`

| Method | Path | Description | Success |
| --- | --- | --- | --- |
| `GET` | `/api/paintings?title=&page=&size=` | Paged list; `title` is a case-insensitive substring match | `200` |
| `GET` | `/api/paintings/{id}` | One painting | `200` |
| `POST` | `/api/paintings` | Create | `201` |
| `PUT` | `/api/paintings/{id}` | Replace all editable fields | `200` |
| `DELETE` | `/api/paintings/{id}` | Delete | `204` |
| `GET` | `/actuator/health` | Liveness | `200` |

`page` is zero-based (default `0`); `size` defaults to `12` and is capped at `100`. Results are ordered by `id`.

Page response:

```json
{ "content": [ { "id": 1, "title": "Sunset", "artist": "A. Sharma", "description": "Acrylic", "price": 4500.00, "stock": 3, "imageUrl": "https://example.com/sunset.jpg" } ],
  "page": 0, "size": 12, "totalElements": 1, "totalPages": 1 }
```

Validation rules: `title` ≤ 150 chars and `artist` ≤ 120 chars (both required), `description` ≤ 2000, `price` ≥ 0.01 with at most 2 decimals, `stock` ≥ 0, `imageUrl` an `http(s)` URL ≤ 1000 chars (optional).

Error response (all failures):

```json
{ "timestamp": "2026-01-01T10:00:00Z", "status": 400, "error": "Bad Request",
  "message": "Request validation failed", "path": "/api/paintings",
  "fieldErrors": { "title": "must not be blank" } }
```

Example:

```bash
curl -X POST http://localhost:8080/api/paintings -H "Content-Type: application/json" \
  -d '{"title":"Sunset Over Hills","artist":"A. Sharma","price":4500.00,"stock":3}'
```

## Configuration

Backend (`backend/src/main/resources/application*.yml`):

| Setting | Default | Notes |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `dev` | `dev` adds the sample-data migration (`db/dev`) and the H2 console (`/h2-console`, JDBC URL `jdbc:h2:mem:paintingdb`, user `sa`, empty password). Any other profile runs only the schema migration. |

### Database migrations

The schema is owned by [Flyway](https://flywaydb.org); Hibernate only validates it (`ddl-auto: validate`).

| Location | Applied in | Contents |
| --- | --- | --- |
| `backend/src/main/resources/db/migration` | every profile | Schema (`V1__create_paintings.sql`). Add new changes as new versioned files; never edit an applied one. |
| `backend/src/main/resources/db/dev` | `dev` only | Sample paintings (`V1000__…`). Versions start at 1000 so they sort after schema migrations. |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed to call `/api/**`. |

Frontend: see [`frontend/README.md`](frontend/README.md) (`VITE_API_BASE_URL`, `VITE_ENABLE_MUTATIONS`).

## Testing

```bash
cd backend  && ./mvnw verify    # unit (Mockito), repository (@DataJpaTest) and API integration tests (MockMvc + H2)
cd frontend && npm test         # component, page, API-client and validation tests
```

## Repository layout

```text
backend/    Spring Boot API (Maven wrapper included)
frontend/   React app
docs/       Specs and roadmap (backend-spec.md, frontend-spec.md, roadmap.md)
.github/    CI workflow
```

## Scope and known limitations

- **No authentication or authorisation yet:** create, update and delete are open. Do not expose this API publicly as is. Planned in [`docs/roadmap.md`](docs/roadmap.md) (Phase 3).
- **H2 is in-memory and development-only.** The schema is already managed by Flyway migrations; adding a PostgreSQL profile is on the roadmap.
- **Images are URLs only** (no upload/storage yet). The seed data hot-links Wikimedia Commons.
- Checkout, payments and orders are out of scope for this milestone.

## License

[MIT](LICENSE)
