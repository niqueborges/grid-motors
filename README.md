# Grid Motors

Welcome to the **Grid Motors API**. This is the final project for the Challenge | Bootcamp - AWS AI FDE BACK-END JOURNEY NODE.JS - AI/R BELONG_ABR26.

The goal of this project is to provide a complete RESTful API for managing car rentals, including user authentication, vehicle inventory, accessories, and reservation management with business rules.

[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

---

## 🛠 What's under the hood?

- **[Node.js](https://nodejs.org/en/)** (v26.x LTS) & **[NestJS](https://nestjs.com/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Prisma ORM](https://www.prisma.io/)** with **[PostgreSQL](https://www.postgresql.org/)**
- **[Redis](https://redis.io/)** for caching
- **[Docker &amp; Docker Compose](https://www.docker.com/)**
- **[Jest](https://jestjs.io/)** for unit and E2E testing
- **[Swagger](https://swagger.io/)** for API documentation
- **[Passport](http://www.passportjs.org/)** and **JWT** for authentication

---

# 🏗 Architecture & Folder Structure

The project follows a modular architecture inspired by Clean Architecture principles, keeping responsibilities separated and the codebase scalable.

## System Architecture

```mermaid
flowchart TD
    Client([Client / Swagger UI]) -->|HTTP REST| API
    
    subgraph "Docker Compose"
        subgraph "NestJS Application"
            API[API Controllers]
            Auth[Auth & JWT Strategy]
            Services[Business Services]
            Repos[Prisma Repositories]
            
            API --> Auth
            API --> Services
            Services --> Repos
        end
        
        Cache[(Redis Cache)]
        DB[(PostgreSQL)]
        
        Services -.->|Cache Data| Cache
        Repos -->|Prisma ORM| DB
    end
```

## Folder Structure

```
grid-motors/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Database schema
├── prisma.config.ts         # Prisma 7 configuration
├── src/
│   ├── auth/                # Authentication, JWT strategy and guards
│   ├── cars/                # Car and accessories management
│   ├── common/              # Global filters, validators and providers
│   ├── reservations/        # Rental business rules
│   ├── users/               # User management and integrations
│   ├── main.ts              # Application entry point
│   └── app.module.ts
├── test/                    # E2E tests
├── .env                     # Local environment (ignored by Git)
├── .env.example             # Local environment template
├── .env.docker.example      # Docker environment template
├── .gitignore
├── docker-compose.yml       # API, PostgreSQL and Redis services
├── Dockerfile               # Multi-stage production build
└── README.md
```

The `.env` file is intentionally ignored by Git.

Create your local configuration from the template:

- `.env.example` → unified environment template (serves both local execution and Docker Compose)
- `.env.docker.example` → reference template for standalone container network variables

---

# 🗄️ Database Schema

The API uses a relational database structure managed by Prisma ORM.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String cpf UK
        DateTime birth
        String email UK
        String password
        String cep
        String street
        String neighborhood
        String city
        String state
        String qualified
        DateTime createdAt
        DateTime updatedAt
    }
    
    Car {
        String id PK
        String model
        String color
        Int year
        Float value_per_day
        Int number_of_passengers
        DateTime createdAt
        DateTime updatedAt
    }
    
    Accessory {
        String id PK
        String description
        String carId FK
        DateTime createdAt
        DateTime updatedAt
    }
    
    Reservation {
        String id PK
        DateTime start_date
        DateTime end_date
        Float final_value
        String userId FK
        String carId FK
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--o{ Reservation : "makes"
    Car ||--o{ Reservation : "has"
    Car ||--o{ Accessory : "has"
```

---

# 🚀 Running the Project

## Requirements

Make sure you have installed:

- Node.js 26.x LTS
- Docker Engine
- Docker Compose V2

Check your environment:

```bash
docker --version
docker compose version
node -v
npm -v
```

---

# 🐳 Running with Docker (recommended)

Docker Compose starts the complete application environment:

- NestJS API
- PostgreSQL database
- Redis cache

## 1. Clone the repository

```bash
git clone https://github.com/niqueborges/grid-motors.git
cd grid-motors
```

## 2. Configure environment variables

Create your `.env` file:

```bash
cp .env.example .env
```

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grid_motors?schema=public"
DB_PASSWORD=postgres
JWT_SECRET="change-me"
REDIS_HOST=localhost
REDIS_PORT=6379
```

When executing via Docker Compose, the `api` service automatically overrides the database and Redis network hosts (`db:5432` and `redis:6379`) through its internal network, allowing a single `.env` file to be used seamlessly for both Docker and local development.

## 3. Build and start containers

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker ps
```

Expected containers:

```
grid-motors-api
grid-motors-db
grid-motors-redis
```

The API will be available at:

```
http://localhost:3000/api/v1
```

Swagger documentation:

```
http://localhost:3000/api/v1/api-docs
```

The API container automatically runs Prisma migrations:

```bash
npx prisma migrate deploy
```

---

# 💻 Running locally (API outside Docker)

This option runs PostgreSQL and Redis using Docker while running NestJS locally.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure local environment

If not created yet, create your local `.env`:

```bash
cp .env.example .env
```

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grid_motors?schema=public"
DB_PASSWORD=postgres
JWT_SECRET="change-me"
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 3. Start infrastructure services

Start PostgreSQL and Redis containers:

```
docker compose up -d db redis
```

Local services:

```
PostgreSQL: localhost:5433
Redis: localhost:6379
```

## 4. Generate Prisma Client and database migrations

Generate Prisma Client and apply database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

## 5. Start the application

Development mode:

```bash
npm run start:dev
```

---

# 📚 API Documentation

Swagger documentation:

```
http://localhost:3000/api/v1/api-docs
```

Authentication flow:

1. Create a user.
2. Login:

```
POST /api/v1/auth/login
```

3. Copy the JWT token.
4. Click **Authorize** in Swagger and provide the token.

![Swagger UI](docs/swagger-ui.png)

---

# 🧠 Technical Decisions & Modernization Features

Key architecture and engineering decisions implemented across the API:

- **Dependency Injection & Repository Pattern:** Services are decoupled from Prisma through repository abstractions, keeping business logic independent from infrastructure details.
- **JWT Authentication & Fail-Fast Secrets:** Mandatory authentication with fail-fast bootstrap validation ensuring `JWT_SECRET` is non-empty.
- **Data Minimization (LGPD):** `GET /users` enforces strict minimal projection (`id`, `name`, `qualified`), suppressing cadastral personal data and credentials from listing responses.
- **Resource Ownership Authorization (ABAC):** Profile queries, updates, and account deletions (`/users/:id`), as well as reservation mutations (`/reservations/:id`), enforce strict ownership checks returning `HTTP 403 Forbidden` to prevent IDOR and enumeration attacks.
- **Consistent Collection Pagination:** All collection listing endpoints (`/cars`, `/reservations`, `/users`) implement standardized pagination envelopes (`{ items, total, limit, offset, offsets }`) with defensive upper bounds (`limit <= 100`) and deterministic ordering.
- **Reservation Concurrency Control:** Row-level pessimistic locking (`SELECT ... FOR UPDATE`) inside database transactions prevents concurrent double-booking of vehicles and user schedule overlaps.
- **Redis Caching & Automatic Invalidation:** High-frequency vehicle queries are cached via Redis, and automatically invalidated across mutations (`POST`, `PATCH`, `DELETE`).
- **Container Health & Operational Resilience:** Docker Compose coordinates service availability with healthchecks (`pg_isready`, `redis-cli ping`) before running Prisma migrations and application bootstrap.
- **Historical Rental Values:** Final rental values are calculated and stored during reservation creation, preserving financial auditability.
- **Global Exception Filter:** Centralized exception handling standardizes RFC-compliant HTTP error payloads.

---

# 📑 Architecture Decision Records (ADR)

Significant architectural and technical decisions are documented in the `docs/adr/` directory:

- [ADR 0001: Context and Scope of Modernization](docs/adr/0001-context-and-scope-of-modernization.md)
- [ADR 0002: Node.js Runtime Version](docs/adr/0002-nodejs-runtime.md)
- [ADR 0003: User Authentication, Data Minimization, and Ownership Authorization Policy](docs/adr/0003-users-authentication-and-ownership-authorization.md)
- [ADR 0004: User Listing Pagination, Envelope Contract, and Deterministic Ordering](docs/adr/0004-users-pagination.md)
- [ADR 0005: Cache Invalidation, Operational Resilience, and Test Coverage Enforcement](docs/adr/0005-cache-invalidation-and-operational-resilience.md)

For a chronological release log of all modifications, see [CHANGELOG.md](CHANGELOG.md).

---

# 🧪 Testing & Quality Gates

The test suite includes comprehensive unit tests (testing services, controllers, providers, and concrete Prisma repositories) and end-to-end integration tests.

Run unit tests:

```bash
npm run test
```

Run test coverage (enforcing 70% minimum global threshold across all metrics):

```bash
npm run test:cov
```

Run end-to-end integration tests:

```bash
npm run test:e2e
```

Run static analysis and linting:

```bash
npm run lint
```

---

Developed by Monique Borges.
