# ADR 0001: Context and Scope of Modernization

- **Status:** Accepted
- **Date:** 2026-11-07
- **Project:** Grid Motors API

## 1. Context

Grid Motors is a RESTful API for a vehicle rental management system,
originally developed as the final project of the
AWS AI FDE Back-End Journey (Node.js) bootcamp, AI/R Belong, in 2026.

The original project provides features for:

- User registration and authentication.
- Vehicle inventory management.
- Vehicle accessories management.
- Rental reservation management.
- Reservation business rules and availability validation.

The application was built using Node.js, TypeScript, NestJS, Prisma ORM,
PostgreSQL, Redis, Docker Compose, Jest, Passport and JWT.

The original challenge specification and Swagger documentation are
preserved in the `docs/` directory:

- `docs/desafio_final.pdf`
- `docs/swagger-ui.png`

The repository also contains the annotated Git tag `v1.0.0`,
which identifies a historical release commit dated July 11, 2026:
`25ffeff5d41d05681ea852d507930ed613dca783`.

This release is part of the project's history and must remain unchanged.

## 2. Motivation

The purpose of this modernization is to review and improve the existing
application using current, stable and supported technologies and
software engineering practices.

The project will also serve as a technical portfolio demonstrating
the ability to:

- Evaluate an existing codebase.
- Identify security, reliability and maintainability risks.
- Make and document technical decisions.
- Improve automated testing and validation.
- Handle database consistency and concurrent operations.
- Maintain reproducible development and deployment environments.

The goal is not to rewrite the application or replace its original
architecture without a clear technical reason.

## 3. Decision

The project will be modernized incrementally, preserving its original
history and maintaining the existing application as the foundation.

The modernization will follow these principles:

1. Preserve the original `v1.0.0` tag and the historical release.
2. Preserve `main` as the reference branch for the currently published baseline.
3. Use `develop` as the integration branch for modernization work.
4. Implement changes in small, independently reviewable branches.
5. Validate changes through automated tests and static analysis.
6. Document significant architectural and technical decisions using ADRs.
7. Record relevant changes in a `CHANGELOG.md`.
8. Avoid introducing unnecessary infrastructure, dependencies or costs.

## 4. Scope

The modernization is expected to cover the following areas.

### 4.1 Runtime and dependencies

- Review the Node.js runtime version and its support lifecycle.
- Verify compatibility with NestJS, Prisma and the complete dependency tree.
- Review direct and transitive dependencies.
- Resolve known security vulnerabilities without blindly applying
  potentially breaking automatic updates.
- Keep dependency versions and lockfile consistent.

### 4.2 Persistence and database consistency

- Review the Prisma configuration and supported version.
- Correct database queries that are inconsistent with the actual schema.
- Review transaction boundaries and row-locking strategies.
- Address concurrent reservation scenarios.
- Evaluate database indexes based on actual query patterns.

### 4.3 Security and application behavior

- Review authentication and authorization behavior.
- Prevent user enumeration through inconsistent authentication errors.
- Remove insecure fallback secrets.
- Review exception handling and avoid exposing internal errors.
- Standardize input validation and identifier handling.

### 4.4 Business rules and caching

- Review reservation date calculations and boundary conditions.
- Verify vehicle and user reservation conflict rules.
- Review reservation update behavior against the original specification.
- Define cache invalidation behavior for vehicle mutations.
- Preserve intentional API behavior changes only when documented.

### 4.5 Testing and quality

- Improve unit and integration test coverage.
- Add tests for relevant business rules and failure scenarios.
- Include database-backed tests for concurrency-sensitive behavior.
- Establish measurable coverage thresholds.
- Keep TypeScript compilation and linting checks passing.

### 4.6 Docker and documentation

- Review Docker images and service configuration.
- Improve service startup reliability and health checks.
- Review environment variable templates and configuration safety.
- Keep setup and execution instructions reproducible.
- Document relevant operational decisions.

## 5. Non-goals

The modernization will not:

- Rewrite the application from scratch.
- Change the business domain without justification.
- Introduce microservices merely for architectural appearance.
- Add cloud infrastructure that creates unnecessary recurring costs.
- Replace technologies solely because newer alternatives exist.
- Change API contracts silently.
- Remove the original challenge documentation.
- Alter the historical `v1.0.0` release.

Any proposed change that affects the original challenge requirements
must be evaluated, tested and documented before implementation.

## 6. Development and validation strategy

The modernization will use the following Git workflow:

- `main`: reference branch for the currently published baseline.
- `develop`: integration branch for modernization.
- Short-lived branches: one per implementation phase.

Each phase must be reviewed and validated before integration into
`develop`.

Changes must not be committed or pushed without explicit authorization.

Validation may include:

- Automated tests.
- Test coverage.
- TypeScript compilation.
- ESLint.
- Dependency security audits.
- Database migration checks.
- Docker build and execution checks.

The validation criteria will be defined and recorded as the work progresses.

## 7. Versioning

The existing `v1.0.0` tag will remain unchanged.

A future release version will be evaluated after the modernization
scope has been implemented and validated.

The version number must reflect the actual impact of the changes,
rather than being assigned in advance.

## 8. Consequences

This approach preserves the original project's history while making
the modernization traceable and reviewable.

It also introduces additional documentation and validation work.
That effort is intentional: the resulting repository should demonstrate
not only working code, but also engineering judgment, technical
decision-making and maintainability.
