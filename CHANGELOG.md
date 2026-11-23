# Changelog

All notable changes to Grid Motors will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-23

### Added

- Declared the supported Node.js runtime in `.nvmrc` and `package.json` (Node.js 26 LTS).
- Added end-to-end test execution to the CI workflow.
- Documented modernization decisions through ADR-0001, ADR-0002, ADR-0003, ADR-0004, and ADR-0005.
- Enforced mandatory `JWT_SECRET` validation with fail-fast application bootstrap.
- Enforced `ParseUUIDPipe` validation across all `:id` route parameters in `reservations` and `users`.
- Added JWT Bearer authentication to `GET /users`, `GET /users/:id`, `PATCH /users/:id`, and `DELETE /users/:id` (ADR-0003).
- Implemented data minimization for user listing (`GET /users`), projecting exclusively `id`, `name`, and `qualified` (`UserSummaryDto`).
- Implemented resource ownership validation for user profile retrieval, update, and deletion (`req.user.id === id`), rejecting unauthorized access with `HTTP 403 Forbidden`.
- Implemented resource ownership validation for reservation mutations (`PATCH` and `DELETE /reservations/:id`), rejecting third-party manipulation with `HTTP 403 Forbidden`.
- Implemented pessimistic row-level locking (`SELECT ... FOR UPDATE`) in `createWithCarLock` and `updateWithCarLock` to prevent concurrent reservation overlaps.
- Implemented pagination envelope on `GET /users` with query parameters `limit` and `offset` (`FindUsersQueryDto`), deterministic ordering (`name ASC, id ASC`), and `offsets` calculation (ADR-0004).
- Added Swagger documentation and schema for paginated user responses (`PaginatedUsersResponseDto`).
- Added automatic Redis cache invalidation on vehicle and accessory mutations in `CarsService` (ADR-0005).
- Added Docker container healthchecks for PostgreSQL (`pg_isready`) and Redis (`redis-cli ping`), with `condition: service_healthy` in `docker-compose.yml`.
- Added concrete repository unit test suites for `PrismaCarsRepository`, `PrismaReservationsRepository`, and `PrismaUsersRepository`.
- Enforced 70% minimum global test coverage threshold across statements, branches, functions, and lines in Jest.

### Changed

- Updated the project runtime to Node.js 26 LTS across Dockerfile, package engines, and GitHub Actions CI.
- Updated `GET /users` response contract from raw array (`UserSummaryDto[]`) to pagination envelope `{ users, total, limit, offset, offsets }` (breaking change).
- Mitigated `effect` ReDoS dependency vulnerability (GHSA-7589-6fvf-x4pw) via package `overrides` (`^3.22.5`).
- Unified local and container environment configuration with `DB_PASSWORD` in `.env.example`.

### Removed

- Removed legacy unpaginated `findAll()` method from `IUsersRepository`, `PrismaUsersRepository`, and `UsersService`.
- Eliminated user enumeration vulnerability during authentication by unifying `POST /auth/login` error responses.

## [1.0.0] - 2026-07-11

### Added

- Repository version identified by the Git tag `v1.0.0`.
