# ADR 0005: Cache Invalidation, Operational Resilience, and Test Coverage Enforcement

- **Status:** Accepted
- **Date:** 2026-11-23
- **Project:** Grid Motors API

## 1. Context and Motivation

During the modernization of the Grid Motors API (following ADR-0001 §4.4, §4.5, and §4.6), several operational, consistency, and quality gaps were audited:

1. **Cache Staleness on Vehicle Mutations:**
   `GET /cars` utilizes `@UseInterceptors(CacheInterceptor)` backed by Redis to optimize read performance. However, car creation (`POST /cars`), attribute updates (`PATCH /cars/:id`), accessory mutations (`PATCH /cars/:id/accessories`), and deletion (`DELETE /cars/:id`) did not invalidate cached entries, resulting in clients receiving stale vehicle catalog data following write operations.

2. **Container Startup Race Condition:**
   In `docker-compose.yml`, the `api` service declared `depends_on: [db, redis]` without health status evaluation. The database migration command (`prisma migrate deploy`) executed upon container startup could execute before PostgreSQL had initialized and accepted socket connections, causing intermittent startup crashes.

3. **Absence of Enforced Test Coverage Thresholds:**
   Although the unit and end-to-end test suites expanded during Etapas 1, 2, and 3, `package.json` lacked automated coverage threshold enforcement (`coverageThreshold`). As a result, code modifications could introduce regressions in coverage without failing the continuous integration pipeline.

4. **Security Vulnerability in Dependency Tree:**
   A high-severity Regular Expression Denial of Service (ReDoS) vulnerability (GHSA-7589-6fvf-x4pw) was reported in `effect <= 3.22.0`, a transitive dependency of `@prisma/config` (Prisma 7 CLI). Automated resolution via `npm audit fix --force` would downgrade Prisma from version 7 to version 6, introducing breaking changes to Prisma 7 configuration and drivers.

## 2. Decision

The following technical decisions are adopted to ensure operational resilience, cache consistency, and quality assurance:

### 2.1 Cache Invalidation Strategy
- In `CarsService`, inject the global `CACHE_MANAGER` (with `@Optional()` for test and standalone flexibility).
- On any mutating operation (`create`, `update`, `remove`, `updateAccessory`), invoke `invalidateCache()` (`await this.cacheManager.clear()`) after successful repository persistence.
- This ensures immediate invalidation of cached vehicle catalog listings across Redis instances upon state modifications.

### 2.2 Docker Compose Healthchecks and Dependency Ordering
- Configure healthchecks on infrastructure dependencies in `docker-compose.yml`:
  - `db`: `test: ["CMD-SHELL", "pg_isready -U postgres -d grid_motors"]`, interval 5s, timeout 5s, retries 5.
  - `redis`: `test: ["CMD-SHELL", "redis-cli ping | grep PONG"]`, interval 5s, timeout 5s, retries 5.
- Update `api` service dependency declaration to require healthy state:
  ```yaml
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
  ```
- Expose `DB_PASSWORD` explicitly in `.env.example` to ensure full environment template reproducibility.

### 2.3 Concrete Repository Testing and Coverage Enforcement
- Implement unit test suites directly testing the concrete Prisma repositories:
  - `src/cars/repositories/prisma-cars.repository.spec.ts`
  - `src/reservations/repositories/prisma-reservations.repository.spec.ts`
  - `src/users/repositories/prisma/prisma-users.repository.spec.ts`
- Ensure tests validate actual query parameters, filters, sorting, row locking (`FOR UPDATE`), and transaction semantics.
- Configure global coverage threshold in `package.json`:
  ```json
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
  ```
  All builds in CI must fail if any global metric drops below 70%.

### 2.4 Dependency Vulnerability Mitigation
- Resolve GHSA-7589-6fvf-x4pw by applying an npm `overrides` entry targeting `"effect": "^3.22.5"`.
- This patches the ReDoS vulnerability cleanly within the 3.x semver line, avoiding any breaking changes or forced downgrades to Prisma 6.

## 3. Consequences

- Guarantees immediate cache consistency for the vehicle catalog without stale read artifacts.
- Eliminates container startup race conditions during database migration and deployment.
- Prevents code quality regressions by enforcing a strict 70% test coverage gate on CI pipelines.
- Resolves known dependency security vulnerabilities while preserving the Prisma 7 modern runtime architecture.
