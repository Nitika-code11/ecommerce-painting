# Backend Specification --- Painting E-commerce API

**Version:** 2.0\
**Status:** MVP specification\
**Stack:** Java 17, Spring Boot 3.3.x, Spring Web, Spring Data JPA,
Hibernate, Bean Validation, Maven, H2 for local development

## 1. Purpose

Provide a REST API for the Painting E-commerce frontend. The MVP manages
painting catalogue records. It does not yet implement customer accounts,
carts, checkout, orders, payments, or production deployment.

This document describes the intended contract and engineering
requirements. Verify endpoint details against the current source code;
this document alone does not prove that each feature is implemented.

## 2. Scope

Included: create, read, update, search, and delete painting records;
JSON requests/responses; request validation; consistent HTTP status
codes and errors; layered architecture; JPA/Hibernate persistence; H2
local database; unit and integration tests.

Not included: authentication/authorization, cart, orders, payment,
refunds, shipping, image binary storage, customer accounts, production
migrations/deployment, advanced search or pagination unless added
explicitly.

## 3. Technology and architecture

-   Java 17
-   Spring Boot 3.3.x
-   Spring Web
-   Spring Data JPA
-   Hibernate as the JPA provider
-   Jakarta Bean Validation
-   H2 in-memory database for local development
-   Maven

Request flow:

``` text
HTTP request
    |
    v
PaintingController
    |
    v
PaintingService
    |
    v
PaintingRepository
    |
    v
Hibernate / JPA
    |
    v
H2 database (local)
```

Responsibilities: - **Controller:** HTTP mapping, request/response
handling, status codes. - **Service:** business rules and transaction
boundaries. - **Repository:** database access. - **Entity:** persistence
mapping. - **DTOs:** API contract, separate from persistence internals
where practical. - **Validation:** rejects invalid requests. -
**Exception handling:** maps expected failures to appropriate HTTP
responses.

Avoid putting business rules directly in controllers or treating JPA
entities as the permanent public API contract.

## 4. Painting data model

  -----------------------------------------------------------------------
  Field                   Suggested type          Rules
  ----------------------- ----------------------- -----------------------
  `id`                    `Long`                  Database-generated;
                                                  read-only for clients

  `title`                 `String`                Required, trimmed,
                                                  documented maximum
                                                  length

  `artist`                `String`                Required, documented
                                                  maximum length

  `description`           `String`                Optional

  `price`                 `BigDecimal`            Required; non-negative
                                                  or positive according
                                                  to agreed rule

  `stock`                 `Integer`               Required; non-negative
                                                  integer

  `imageUrl`              `String`                Optional URL; validate
                                                  if provided
  -----------------------------------------------------------------------

Use `BigDecimal` for money rather than `double` to avoid binary
floating-point rounding issues. If the current entity uses another type,
treat a change as an explicit task with tests and migration
considerations.

## 5. REST API contract

Base path: `/api/paintings`

  ---------------------------------------------------------------------------------------
  Method            Path                            Purpose           Expected status
  ----------------- ------------------------------- ----------------- -------------------
  GET               `/api/paintings`                List paintings    `200 OK`

  GET               `/api/paintings?title=Sunset`   Search by title   `200 OK`

  GET               `/api/paintings/{id}`           Get one painting  `200 OK` or
                                                                      `404 Not Found`

  POST              `/api/paintings`                Create a painting `201 Created`

  PUT               `/api/paintings/{id}`           Update a painting `200 OK` or
                                                                      `204 No Content`,
                                                                      per chosen
                                                                      contract; `404` if
                                                                      absent

  DELETE            `/api/paintings/{id}`           Delete a painting `204 No Content`,
                                                                      or `404` if absent
  ---------------------------------------------------------------------------------------

The exact status codes and response shapes must match the implementation
and be documented consistently. Do not assume an endpoint is implemented
merely because it appears here.

Example create request:

``` http
POST /api/paintings
Content-Type: application/json
```

``` json
{
  "title": "Sunset",
  "artist": "Amit",
  "description": "Warm sunset over the sea",
  "price": 2500.00,
  "stock": 4,
  "imageUrl": "https://example.com/sunset.jpg"
}
```

Example response body:

``` json
{
  "id": 1,
  "title": "Sunset",
  "artist": "Amit",
  "description": "Warm sunset over the sea",
  "price": 2500.00,
  "stock": 4,
  "imageUrl": "https://example.com/sunset.jpg"
}
```

These are intended-contract examples, not a claim that the current
application returns exactly these bodies.

## 6. Request validation

Use Jakarta Bean Validation on request DTOs, for example: - `@NotBlank`
for required text. - `@Size` for maximum string length. - `@NotNull` for
required numeric fields. - `@DecimalMin` for price. - `@Min(0)` for
stock. - A URL constraint only if an appropriate validator dependency is
present; otherwise use a suitable URL validation method.

Use `@Valid` on controller request bodies. Return `400 Bad Request` for
invalid input with useful field-level messages that do not reveal
internals.

The backend is authoritative: never rely on TypeScript or browser
validation for data integrity or API security.

## 7. Response and error handling

Use a consistent JSON error format, for example:

``` json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Request validation failed",
  "fieldErrors": {
    "title": "must not be blank"
  }
}
```

Recommended behaviour: - `400 Bad Request`: malformed JSON or validation
failure. - `404 Not Found`: painting does not exist. - `409 Conflict`:
only for a defined business conflict. - `500 Internal Server Error`:
unexpected failure; do not return stack traces or sensitive details.

Use `@ControllerAdvice` or `@RestControllerAdvice` for consistent
exception handling. Do not return `200 OK` for failed operations.

## 8. Persistence and database configuration

For local development, an in-memory H2 database may use:

``` properties
spring.datasource.url=jdbc:h2:mem:paintingdb
spring.datasource.driverClassName=org.h2.Driver
spring.jpa.hibernate.ddl-auto=update
```

Verify the actual configuration and dependencies in the project.

-   H2 in-memory data is normally lost when the application stops.
-   For production-oriented database workflows, use schema migrations
    such as Flyway instead of relying on Hibernate schema auto-update.
-   Configure PostgreSQL or another selected production database through
    an environment-specific profile.
-   Never commit production credentials.
-   Add indexes based on measured query requirements.
-   If relationships are introduced, choose fetch strategies
    deliberately and test query counts to avoid N+1 behaviour.

## 9. Transactions and service layer

-   Put business operations in the service layer.
-   Use `@Transactional` at appropriate service boundaries.
-   Use read-only transactions for suitable read operations where
    helpful.
-   Keep transactions short.
-   Define behaviour for updates/deletes of missing records.
-   Test persistence and failure cases.

## 10. Security and configuration

Authentication is not included in the current MVP. Do not expose write
endpoints publicly in production until authentication and authorization
are implemented.

-   Configure CORS only for required frontend origins.
-   Keep secrets outside source control.
-   Validate and constrain incoming data.
-   Do not trust client-supplied IDs or prices for future checkout/order
    operations.
-   Add authentication, authorization, rate limiting, and appropriate
    security headers before public production use.

## 11. Testing requirements

-   Unit-test service business rules.
-   Test repository behaviour.
-   Use Spring Boot integration tests for endpoints, serialization,
    validation, and persistence.
-   Test not-found cases, malformed JSON, and invalid fields.
-   Test create/read/update/delete workflows.
-   Verify exact JSON contracts expected by the frontend.
-   If relationships are added, test query counts for
    performance-sensitive endpoints.

## 12. Suggested project structure

``` text
src/main/java/.../painting/
  controller/
    PaintingController.java
  service/
    PaintingService.java
  repository/
    PaintingRepository.java
  entity/
    Painting.java
  dto/
    PaintingRequest.java
    PaintingResponse.java
  exception/
    GlobalExceptionHandler.java
    PaintingNotFoundException.java
```

Adapt package names and files to the existing project. Introduce DTOs if
entities are currently exposed directly; avoid duplicate classes without
a reason.

## 13. Observability and performance

-   Log useful failures without logging secrets or unnecessary personal
    data.
-   Measure API latency and database query counts before optimizing.
-   Avoid N+1 queries when loading related entities.
-   Add pagination before the catalogue grows large.
-   Use PostgreSQL `EXPLAIN ANALYZE` to investigate queries; remember
    that it executes the query.
-   Do not assume `JOIN FETCH` always improves total memory use or
    response time; measure with representative data.

## 14. Definition of done

-   Endpoints, status codes, and response bodies are consistent and
    documented.
-   Backend validation is enforced.
-   Errors use a predictable response shape.
-   Controller, service, and repository responsibilities are separated.
-   Tests cover successful and unsuccessful cases.
-   Local setup works from documented instructions.
-   No secrets are committed.
-   Frontend and backend agree on JSON names, nullability, and response
    shapes.
-   Production requirements are marked as not implemented until
    verified.

## 15. Decisions to confirm

-   Whether the current entity fields match the model above.
-   Whether list endpoint returns an array or wrapper object.
-   Exact response body and status code for create/update/delete.
-   Whether price may be zero.
-   Whether `description` and `imageUrl` may be null.
-   Whether title search is case-sensitive or partial.
-   Whether the current code uses DTOs or returns entities directly.
-   Which production database and migration tool will be used.
