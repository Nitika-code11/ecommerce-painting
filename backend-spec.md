# Backend Specification — Painting E-commerce

## 1. Purpose and Current Scope

Build a REST API for managing a catalogue of paintings. The current MVP supports create, read, title search, update, and delete operations.

This specification describes the existing starter application and the expected behavior for its catalogue API. Authentication, customer accounts, cart, orders, payments, image upload, pagination, and production database configuration are future work.

## 2. Technology Stack

- Java 17
- Spring Boot 3.3
- Maven
- Spring Web
- Spring Data JPA
- Jakarta Bean Validation
- Hibernate as the JPA provider
- H2 in-memory database for local development
- JUnit and Spring Boot Test for automated tests

## 3. Architecture

Use a layered structure:

1. **Controller:** HTTP routing, request binding, validation trigger, and response status.
2. **Service:** application/business logic and not-found handling.
3. **Repository:** database access using Spring Data JPA.
4. **Entity:** persistent `Painting` model.
5. **Database:** H2 for local development.

Keep business logic out of the controller and avoid placing HTTP-specific concerns in the repository.

Current package structure:

```text
com.example.painting/
├── PaintingEcommerceApplication.java
└── painting/
    ├── Painting.java
    ├── PaintingController.java
    ├── PaintingService.java
    └── PaintingRepository.java
```

## 4. Painting Data Model

The current `Painting` entity contains:

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` | Generated primary key |
| `title` | `String` | Required, max 150 characters |
| `artist` | `String` | Required, max 120 characters |
| `description` | `String` | Optional, max 2,000 characters |
| `price` | `BigDecimal` | Required, greater than 0; precision 12, scale 2 |
| `stock` | `Integer` | Required, minimum 0 |
| `imageUrl` | `String` | Optional, max 1,000 characters |

Use `BigDecimal` for monetary values rather than floating-point types.

The current API returns the entity directly. A future improvement should introduce request/response DTOs so the persistence model is not exposed as the public API contract.

## 5. REST API

Base path: `/api/paintings`

### 5.1 Create Painting

- **Method:** `POST`
- **Path:** `/api/paintings`
- **Request:** JSON painting fields, excluding any client-supplied ID
- **Success:** `201 Created`
- **Response:** JSON representation of the saved painting

Example request:

```json
{
  "title": "Sunset Over Hills",
  "artist": "A. Sharma",
  "description": "Acrylic on canvas",
  "price": 4500.00,
  "stock": 3,
  "imageUrl": "https://example.com/sunset.jpg"
}
```

The server must generate the ID. Bean Validation must reject invalid required fields and invalid price/stock values.

### 5.2 List Paintings and Search by Title

- **Method:** `GET`
- **Path:** `/api/paintings`
- **Optional query parameter:** `title`
- **Success:** `200 OK`
- **Response:** JSON array

Examples:
- `GET /api/paintings` returns all paintings.
- `GET /api/paintings?title=sunset` returns paintings whose titles contain `sunset`, ignoring case.

An empty search result should return `200 OK` with an empty array, not `404 Not Found`.

### 5.3 Get Painting by ID

- **Method:** `GET`
- **Path:** `/api/paintings/{id}`
- **Success:** `200 OK`
- **Not found:** `404 Not Found`
- **Response:** JSON painting object

### 5.4 Update Painting

- **Method:** `PUT`
- **Path:** `/api/paintings/{id}`
- **Request:** complete set of editable painting fields
- **Success:** `200 OK`
- **Not found:** `404 Not Found`
- **Response:** JSON updated painting object

The service should first verify that the painting exists, then update its editable fields. `PUT` is treated as a full update rather than a partial patch.

### 5.5 Delete Painting

- **Method:** `DELETE`
- **Path:** `/api/paintings/{id}`
- **Success:** `204 No Content`
- **Not found:** `404 Not Found`
- **Response body:** none

Deleting a nonexistent ID should not silently report success.

## 6. Validation and Error Handling

- Trigger Bean Validation for create and update requests.
- Required fields must not be blank.
- Price must be greater than zero.
- Stock must be zero or greater.
- Invalid requests should return `400 Bad Request`.
- Missing painting IDs should return `404 Not Found`.
- Return useful, consistent error responses without leaking stack traces or internal implementation details.
- Add centralized exception handling with `@RestControllerAdvice` as a recommended improvement.
- Document the error response schema and keep it consistent for frontend consumption.

The exact error body should be defined when centralized exception handling is implemented; clients must not depend on undocumented framework-default error formatting.

## 7. Persistence and Configuration

Local development configuration:

```properties
spring.datasource.url=jdbc:h2:mem:paintingdb
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.h2.console.enabled=true
```

- The in-memory database loses its data when the application stops.
- H2 console is for local development only and must not be exposed publicly.
- Before production, move to PostgreSQL or another supported production database.
- Use database migrations, such as Flyway, for controlled schema changes.
- Configure secrets and environment-specific values outside source control.

## 8. Security Requirements

Current status: authentication and authorization are not implemented.

Before public deployment:
- Add Spring Security.
- Require authentication for write operations.
- Restrict create, update, and delete operations to an ADMIN role.
- Define which catalogue read operations are public.
- Configure CORS for trusted frontend origins.
- Validate input and apply sensible request-size limits.
- Do not rely on frontend route restrictions as a security boundary.
- Never commit credentials or production secrets.

## 9. Testing Requirements

- Unit-test service behavior.
- Test repository search semantics, including case-insensitive title matching.
- Test controller status codes and JSON behavior.
- Test validation failures for missing/invalid title, artist, price, and stock.
- Test `404` behavior for missing IDs.
- Test create, update, and delete flows.
- Add integration tests using an isolated test database.
- Ensure tests do not depend on execution order or persistent local data.

## 10. Observability and Production Readiness

Before production:
- Add structured logging without logging secrets.
- Add health checks and metrics.
- Configure connection pooling and database monitoring as appropriate.
- Add request tracing where needed.
- Set up CI to compile, test, and scan dependencies.
- Document deployment, configuration, rollback, and backup procedures.

## 11. Future Scope

Track these separately in `roadmap.md` and implement them only when requirements are defined:

- DTOs and centralized exception handling
- Pagination, sorting, and additional filters
- Authentication and role-based authorization
- Customer profiles and addresses
- Shopping cart and order lifecycle
- Stock reservation and concurrency-safe order placement
- Payment provider integration and webhook idempotency
- Image upload and object storage
- PostgreSQL and database migrations
- OpenAPI documentation
- Docker, CI/CD, and cloud deployment

## 12. Acceptance Criteria

1. The application starts with the documented local configuration.
2. All five catalogue operations behave as specified.
3. Invalid input is rejected with an appropriate HTTP status.
4. Missing IDs return `404 Not Found`.
5. Search is case-insensitive and returns an empty array for no matches.
6. Automated tests cover successful and failure scenarios.
7. The API contract is documented and consistent with frontend expectations.
8. No unsupported security or production-readiness claims are made.
