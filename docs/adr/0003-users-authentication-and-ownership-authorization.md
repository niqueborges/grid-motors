# ADR 0003: User Authentication, Data Minimization, and Ownership Authorization Policy

- **Status:** Accepted
- **Date:** 2026-11-09
- **Project:** Grid Motors API

## 1. Context

The original challenge specification (`docs/desafio_final.pdf`) explicitly mandated Bearer token authentication only for vehicle endpoints (`/cars`), while omitting authentication and authorization requirements for user operations (`/users`) and reservation mutations (`/reservations`).

In the baseline implementation, user routes (`GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`) were completely public and unauthenticated, allowing arbitrary visitors to list cadastral data, query personal details, modify records, or delete user accounts without access controls. Furthermore, reservation update (`PATCH /reservations/:id`) and deletion (`DELETE /reservations/:id`) endpoints lacked resource ownership validation, allowing any authenticated user to alter or cancel reservations belonging to other customers (Insecure Direct Object References — IDOR).

As established in ADR 0001 §4.3 ("Review authentication and authorization behavior"), these access control gaps must be resolved to protect personal data, prevent unauthorized data manipulation, and elevate the project to production-grade engineering standards.

## 2. Decision

The following architectural policies are adopted for authentication, data minimization, and authorization across the application:

### 2.1 User Authentication Policy

1. **Public Registration:** `POST /users` remains public and unauthenticated to allow customer self-registration.
2. **Mandatory Authentication for Remaining Operations:** `GET /users`, `GET /users/:id`, `PATCH /users/:id`, and `DELETE /users/:id` require valid JWT Bearer authentication.

### 2.2 Data Minimization in User Listing (`GET /users`)

1. **Restricted Listing Projection:** To fulfill the challenge specification requiring a user listing operation while adhering to the principle of necessity (data minimization) under Article 6, III of the Brazilian General Data Protection Law (LGPD - Law 13.709/2018), `GET /users` will return exclusively a minimal projection: `id`, `name`, and `qualified`.
2. **Suppression of Cadastral Data:** Cadastral fields (`cpf`, `birth`, `email`, `cep`, `street`, `neighborhood`, `city`, `state`), internal timestamps (`createdAt`, `updatedAt`), and credentials (`password`) are excluded from the listing response.
3. **Clarification on Data Classification:** General cadastral personal data (such as CPF, residential address, birth date, and email) are classified as general personal data under Article 5, I of the LGPD, rather than sensitive personal data under Article 5, II. This policy represents data exposure minimization rather than a claim of comprehensive statutory compliance.

### 2.3 Profile Access Policy (`GET /users/:id`)

1. **Strict Resource Ownership:** `GET /users/:id` is restricted exclusively to the authenticated account owner (`req.user.id === id`).
2. **Fail-Fast Validation:** If the requested route parameter `:id` diverges from the authenticated user (`id !== req.user.id`), the system must reject the request immediately with `HTTP 403 Forbidden` prior to querying the database, preventing user enumeration or existence probing.
3. **Owner Profile Retrieval:** When the authenticated user requests their own profile (`id === req.user.id`), the database is queried. If the record does not exist in the database (e.g., account deleted concurrently), `HTTP 404 Not Found` is returned.
4. **Returned Cadastral Fields:** The profile response returns the cadastral fields relevant to the owner's account (`id`, `name`, `cpf`, `birth`, `email`, `cep`, `qualified`, `street`, `neighborhood`, `city`, `state`, `createdAt`, `updatedAt`), with `password` strictly omitted. The necessity and precision of these fields will be validated during the implementation of dedicated DTOs.

### 2.4 User Ownership in Mutations (`PATCH` and `DELETE`)

1. **Account Mutation Ownership:** `PATCH /users/:id` and `DELETE /users/:id` are permitted only when the authenticated user is the record owner (`req.user.id === id`).
2. **Fail-Fast Enforcement:** Requests targeting a divergent `:id` are rejected immediately with `HTTP 403 Forbidden` before database evaluation.
3. **Owner Evaluation:** If the requested `:id` matches the authenticated user, the database operation proceeds. If the record is not found in the persistence layer, `HTTP 404 Not Found` is returned.
4. **Service-Layer Enforcement:** Ownership checks are enforced within the service layer, maintaining a clear separation between request transport and business security rules.
5. **Separation of Authentication and Profile Operations:** Internal authentication flows (such as refresh token validation in `AuthService`) will use an internal lookup method (`findById()`) that bypasses profile authorization, distinguishing internal infrastructure queries from external user profile operations.

### 2.5 Reservation Ownership Policy (`PATCH` and `DELETE`)

1. **Mutation Authorization:** `PATCH /reservations/:id` and `DELETE /reservations/:id` require that the target reservation belongs to the authenticated user (`reservation.userId === req.user.id`).
2. **Sequential Evaluation Hierarchy:**
   - The reservation is retrieved from persistence by ID.
   - If the reservation does not exist: return `HTTP 404 Not Found`.
   - If the reservation exists but belongs to a different user: return `HTTP 403 Forbidden`.
   - If the reservation belongs to the authenticated user: the operation proceeds (`HTTP 200 OK` for patch, `HTTP 204 No Content` for delete).

### 2.6 Reservation Queries (`GET /reservations` and `GET /reservations/:id`)

1. **Preservation of Challenge Contract:** `GET /reservations` (paginated listing with multi-parameter query filters) and `GET /reservations/:id` (operational lookup) remain accessible to any authenticated user, preserving the challenge specification for rental desk operations.
2. **Residual Confidentiality Risk:** This decision constitutes a deliberate concession to the challenge contract:
   - Direct cadastral data (such as CPF, birth date, and residential address) are not directly returned in these queries.
   - However, operational metadata — including user UUIDs (`userId`), rental start and end dates, vehicle identifiers (`carId`), and calculated rental amounts (`final_value`) — remains exposed to any authenticated user.
   - Depending on the broader operational context, these operational metadata elements may relate to identified or identifiable natural persons.
   - Consequently, retaining this cross-user query capability carries a documented residual confidentiality risk, rather than representing an absence of risk.

### 2.7 Role-Based Access Control (RBAC)

1. **No RBAC Introduction:** Role-based access control (RBAC) will not be introduced in this stage.
2. **Rationale:** The application domain currently models a single user persona (rental customers). Introducing roles, administrative seeds, and permission decorators would add speculative complexity and database schema migrations without documented business domain requirements. Resource ownership (ABAC at resource level) adequately mitigates IDOR vulnerabilities.

### 2.8 HTTP Status Code Semantics

The application enforces consistent HTTP semantics for access control:
- **`400 Bad Request`:** Malformed route parameters (e.g., non-UUID strings intercepted by `ParseUUIDPipe`) or invalid input payloads.
- **`401 Unauthorized`:** Missing, expired, or invalid JWT authentication token.
- **`403 Forbidden`:** Authenticated user lacking authorization to access or mutate a specific resource (ownership violation).
- **`404 Not Found`:** Target resource nonexistent within the authorized context (or nonexistent reservation).

## 3. Future Implementation Strategy

The policies defined in this decision record will be executed incrementally in planned subtasks:

1. **Type-Safe User Decorator:** Create `AuthenticatedUser` interface and custom NestJS param decorator `@CurrentUser()` to eliminate untyped request inspection (`req: any`).
2. **Internal Service Lookup:** Introduce `UsersService.findById(id: string): Promise<UserEntity | null>` for internal consumers (`AuthService`), separating internal infrastructure lookups from authorized profile queries.
3. **Route Validation:** Enforce `ParseUUIDPipe` across all user `:id` route parameters (`GET`, `PATCH`, `DELETE`).
4. **Dedicated DTOs:** Introduce `UserSummaryDto` for minimized listing and `UserProfileDto` for owner profile queries.
5. **Comprehensive Automated Tests:** Implement unit and end-to-end tests validating authentication barriers (401), ownership boundaries (403), absence handling (404), parameter validation (400), and test isolation using ephemeral user accounts.

## 4. Consequences

- Protects cadastral personal data from anonymous scraping and unauthorized peer harvesting.
- Mitigates IDOR vulnerabilities in user profile access and reservation mutation endpoints through explicit ownership enforcement.
- Retains a documented residual confidentiality risk in cross-user reservation queries, as described in §2.6.
- Establishes a predictable, fail-fast authorization mechanism that mitigates resource existence enumeration.
- Preserves compatibility with challenge contracts where justified, documenting residual confidentiality trade-offs.
- Avoids unneeded schema migrations and architectural bloat by prioritizing resource ownership over premature RBAC.
