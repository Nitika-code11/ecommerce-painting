# Painting Ecommerce — Project Roadmap

## Phase 1: MVP catalogue (current)
- [x] Spring Boot project scaffold (Java 17 + Maven)
- [x] Painting entity and repository
- [x] REST endpoints to create, list, view, search, update, and delete paintings
- [x] Request validation and basic error responses
- [x] H2 database for local development

## Phase 2: Catalogue improvements
- [ ] Add pagination and sorting
- [ ] Add filters: artist, price range, medium, style, availability
- [ ] Add categories and tags
- [ ] Add DTOs so persistence entities are not exposed directly
- [ ] Add integration tests for API and validation

## Phase 3: Customers and security
- [ ] Add customer registration and login
- [ ] Add Spring Security and role-based access (CUSTOMER / ADMIN)
- [ ] Restrict painting create/update/delete to ADMIN
- [ ] Add user profile and address management

## Phase 4: Cart and orders
- [ ] Add shopping cart and cart items
- [ ] Add checkout and order lifecycle (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
- [ ] Reserve/decrement stock safely during order placement
- [ ] Add order history and admin order management

## Phase 5: Payments and artwork images
- [ ] Integrate a payment provider using sandbox/test mode
- [ ] Verify payment webhooks and make payment processing idempotent
- [ ] Upload painting images to Amazon S3; store object URLs/keys in the database
- [ ] Validate file type and size; do not make uploaded files public by default

## Phase 6: Production readiness
- [ ] Replace H2 with PostgreSQL (local Docker first, then Amazon RDS)
- [ ] Store secrets in environment variables / AWS Secrets Manager
- [ ] Add structured logs, health checks, metrics, and tracing
- [ ] Add Dockerfile and container build
- [ ] Deploy container to Amazon ECS Fargate behind an Application Load Balancer
- [ ] Use Amazon ECR for images and CloudWatch for logs/alarms
- [ ] Configure a custom domain and HTTPS
- [ ] Set AWS Budget alerts before creating billable resources

## Phase 7: CI/CD and quality
- [ ] Add GitHub Actions CI (tests + build)
- [ ] Use GitHub Actions OIDC for AWS access; avoid long-lived AWS keys
- [ ] Add dependency/security scanning
- [ ] Add API documentation with OpenAPI/Swagger
- [ ] Add load tests and performance targets

## Suggested build order
1. Finish catalogue tests and DTOs.
2. Add PostgreSQL and migrations (Flyway).
3. Add authentication and admin authorization.
4. Implement cart and order workflows.
5. Add sandbox payments and S3 image storage.
6. Containerize, automate CI/CD, and deploy to AWS.

## Definition of done for each phase
- Tests pass locally.
- API behavior and error cases are documented.
- Secrets are not committed.
- Changes are small enough to review and can be run from a clean checkout.
