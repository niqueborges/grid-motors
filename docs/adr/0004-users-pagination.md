# ADR 0004: User Listing Pagination, Envelope Contract, and Deterministic Ordering

- **Status:** Accepted
- **Date:** 2026-11-14
- **Project:** Grid Motors API

## 1. Context and Motivation

During the architecture and security audit of the Grid Motors API codebase (specifically addressing item C4 of the modernization roadmap), an operational scalability and contract consistency gap was identified in the user listing endpoint (`GET /users`).

In the baseline implementation and through the Etapa 2 enhancements (ADR-0003), `GET /users` enforces JWT Bearer authentication and returns a data-minimized array of `UserSummaryDto` objects (`id`, `name`, `qualified`). However, the endpoint returns the entire collection of users as an unpaginated raw JSON array (`UserSummaryDto[]`).

In contrast, vehicle inventory (`GET /cars`) and rental reservations (`GET /reservations`) implement offset-based pagination envelopes (`{ cars, total, limit, offset, offsets }` and `{ reserves, total, limit, offset, offsets }`). The user listing endpoint lacked pagination mechanisms altogether.

As the database grows, returning unbounded collections in a single HTTP payload introduces significant risks:
1. **Memory Exhaustion and DoS:** Large result sets consume excessive memory in both the Node.js API runtime and the PostgreSQL database engine, increasing garbage collection pauses and vulnerability to Denial of Service (DoS).
2. **Network Latency and Bandwidth:** Transmitting unbounded JSON payloads degrades HTTP response times and wastes bandwidth.
3. **Contract Inconsistency:** Consumers of the Grid Motors API encounter divergent listing paradigms: paginated envelope responses in `/cars` and `/reservations`, contrasted with an unpaginated flat array in `/users`.

Although pagination for `/users` was not an explicit requirement of the original challenge specification (`docs/desafio_final.pdf`), it represents an essential technical modernization identified during the architectural audit (C4) to ensure production-grade scalability, reliability, and API consistency.

## 2. Decision

To modernize `GET /users`, the following architectural decisions and contractual specifications are adopted:

### 2.1 Paginated Response Envelope Contract

The response payload of `GET /users` transitions from a flat array (`UserSummaryDto[]`) to a standardized pagination envelope:

```json
{
  "users": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Doe",
      "qualified": "yes"
    }
  ],
  "total": 0,
  "limit": 10,
  "offset": 0,
  "offsets": 0
}
```

The envelope fields are defined as follows:
- **`users`:** An array of `UserSummaryDto` items containing exclusively the minimized fields (`id`, `name`, `qualified`).
- **`total`:** The total count of matching records in the database, calculated via `count()` on the persistence layer.
- **`limit`:** The maximum number of records requested/returned in the current page.
- **`offset`:** The number of initial records skipped.
- **`offsets`:** The total number of available pages, computed as `Math.ceil(total / limit)`.

### 2.2 Semantic Clarification of the `offsets` Field

In alignment with existing conventions established in the Cars and Reservations modules:
- The property name `offsets` is retained for backwards syntactic compatibility across the API ecosystem.
- Semantically, `offsets` represents the **total page count** (`totalPages`), rather than a byte or row offset. For instance, when `total = 45` and `limit = 10`, `offsets = 5`. If `total = 0`, `offsets = 0`.

### 2.3 Query Parameter Validation and Bounds

Pagination parameters are provided via HTTP query string and validated through a dedicated DTO (`FindUsersQueryDto`):

1. **`limit`:**
   - Default: `10`
   - Minimum: `1` (`@Min(1)`)
   - Maximum: `100` (`@Max(100)`)
   - Type: Integer (`@IsInt()`)
2. **`offset`:**
   - Default: `0`
   - Minimum: `0` (`@Min(0)`)
   - Type: Integer (`@IsInt()`)

**Validation and Type Transformation Rules:**
- Query string parameters are transformed to integers via `class-transformer` (`@Type(() => Number)`).
- Decimal, negative, non-numeric, or out-of-range values trigger `HTTP 400 Bad Request` via the global NestJS `ValidationPipe`.
- In contrast to the legacy Cars and Reservations DTOs (which omit an upper bound), `FindUsersQueryDto` explicitly introduces `@Max(100)` to guard against memory exhaustion and deliberate resource depletion attacks.
- Unknown or unexpected query parameters are rejected with `HTTP 400 Bad Request` pursuant to the global `forbidNonWhitelisted: true` validation setting.

### 2.4 Deterministic Ordering

To prevent arbitrary record shuffling during paginated traversal, the repository query must enforce explicit and deterministic ordering:

1. **Primary Sort:** `name ASC` (alphabetical order by user name).
2. **Tie-Breaker Sort:** `id ASC` (unique UUID ordering).

Without deterministic ordering, PostgreSQL does not guarantee row order across query executions, which would result in duplicated or missed records when traversing successive pages.

### 2.5 Data Minimization and Security Continuity

1. **JWT Bearer Authentication:** Mandatory JWT authentication established in ADR-0003 remains strictly enforced on `GET /users`.
2. **Preservation of `UserSummaryDto`:** The projection of user records within the `users` array remains strictly limited to `UserSummaryDto` (`id`, `name`, `qualified`).
3. **No Sensitive Data Exposure:** Password hashes, cadastral data (CPF, birth date, email, address), and internal audit timestamps remain suppressed from the listing.

### 2.6 Schema and Migration Neutrality

1. **No Database Schema Changes:** This pagination feature requires no additions, removals, or alterations to Prisma models.
2. **No Migrations:** No database migrations or schema adjustments are introduced.

### 2.7 Scope Limitation: No Additional Query Filters

In this stage, `GET /users` introduces pagination controls (`limit` and `offset`) exclusively. Additional query filters (such as filtering by name, qualification status, or date ranges) are deliberately excluded to maintain tight architectural scope and avoid speculative query interfaces without documented requirements.

### 2.8 Backwards Compatibility and Breaking Change

1. **Breaking Contract Modification:** The transition from a raw JSON array (`UserSummaryDto[]`) to a pagination envelope object (`{ users, total, limit, offset, offsets }`) constitutes a breaking API contract change for `GET /users`.
2. **Justification:** Aligning `GET /users` with the established pagination envelope convention used across the API eliminates structural inconsistency, constrains the number of returned records to reduce serialized response volume, and reflects production-grade API design.

## 3. Consequences

### Positive Consequences
- Bounds the number of records returned per request and the resulting HTTP response size, helping reduce application memory consumption and network overhead. This does not guarantee bounded database query cost: COUNT operations and large OFFSET values may still require substantial database work.
- Establishes contract consistency across all collection listing endpoints (`/cars`, `/reservations`, `/users`).
- Provides deterministic record ordering across pages for a stable dataset (`name ASC`, `id ASC`).
- Enforces defensive boundaries on pagination requests (`limit` capped at 100).
- Preserves full alignment with data minimization principles (LGPD) and JWT security policies established in ADR-0003.

### Limitations and Residual Risks
- **Database Query Cost Under Scale:** While pagination bounds the number of records delivered to the application, it does not guarantee bounded computation in PostgreSQL. Counting records (`count()`) requires evaluating matching rows, and queries with large `offset` values force the database engine to scan and discard leading rows before returning the target slice. Consequently, pagination reduces application-layer memory pressure, but does not eliminate database-tier resource consumption.
- **Skip/Take Concurrency Limitation:** Standard offset-based pagination (`OFFSET ... LIMIT ...`) does not guarantee absolute transactional snapshot isolation across concurrent writes. If user records are inserted or deleted while a client navigates between pages, items may shift positions, resulting in duplicate or skipped records across page boundaries. Cursor-based (keyset) pagination would offer stronger concurrency guarantees, but offset pagination is adopted to maintain architectural and contractual consistency with the rest of the application.
- **Client Breaking Change:** Existing client integrations expecting a raw array response from `GET /users` must be updated to consume the `users` array inside the response envelope.
