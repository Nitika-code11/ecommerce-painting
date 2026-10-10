# Painting Ecommerce API

A starter Spring Boot REST API for an online store that sells paintings.

## Stack
- Java 17, Spring Boot 3.3, Maven
- Spring Web, Spring Data JPA, Bean Validation
- H2 in-memory database for local development

## Run
Prerequisites: JDK 17+ and Maven 3.8+.

```bash
mvn spring-boot:run
```

API base URL: `http://localhost:8080/api/paintings`

The H2 console is available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:paintingdb`, username `sa`, blank password). This is for local development only.

## Sample requests

Create a painting:
```bash
curl -X POST http://localhost:8080/api/paintings \
  -H "Content-Type: application/json" \
  -d '{"title":"Sunset Over Hills","artist":"A. Sharma","description":"Acrylic on canvas","price":4500.00,"stock":3,"imageUrl":"https://example.com/sunset.jpg"}'
```

List paintings:
```bash
curl http://localhost:8080/api/paintings
```

Get one:
```bash
curl http://localhost:8080/api/paintings/1
```

Search by title:
```bash
curl "http://localhost:8080/api/paintings?title=sunset"
```

Delete:
```bash
curl -X DELETE http://localhost:8080/api/paintings/1
```

## Current scope
This is a learning starter, not a production-ready commerce platform. Authentication, checkout, payments, order management, image upload/storage, pagination, and production database configuration are planned in `roadmap.md`.
