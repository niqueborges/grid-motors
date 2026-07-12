# Grid Motors

Welcome to the **Grid Motors API**. This is the final project for the Challenge | Bootcamp - AWS AI FDE BACK-END JOURNEY NODE.JS - AI/R BELONG_ABR26.

The goal of this project is to provide a complete RESTful API for managing car rentals, including user authentication, vehicle inventory, accessories, and reservation management with business rules.

[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

---

## 🛠 What's under the hood?

- **[Node.js](https://nodejs.org/en/)** (v20+) & **[NestJS](https://nestjs.com/)**
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

Use one of the provided examples to create your local configuration:

- `.env.example` → running the API locally
- `.env.docker.example` → running the complete environment with Docker Compose

---

# 🚀 Running the Project

## Requirements

Make sure you have installed:

- Node.js 20+
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

## 2. Configure Docker environment variables

Create your `.env` file:

```bash
cp .env.docker.example .env
```

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@db:5432/grid_motors?schema=public"
JWT_SECRET="change-me"
REDIS_HOST=redis
REDIS_PORT=6379
```

Inside Docker, services communicate using container names:

```
PostgreSQL: db:5432
Redis: redis:6379
```

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

Create your local .env:

```bash
cp .env.example .env
```

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grid_motors?schema=public"
JWT_SECRET="change-me"
REDIS_HOST=localhost
REDIS_PORT=6379
```

# 3. Start infrastructure services

Start PostgreSQL and Redis containers:

```
docker compose up -d db redis
```

Local services:

```
PostgreSQL: localhost:5433
Redis: localhost:6379
```

## 4. Generate Prisma Cliente and database migrations

npx prisma client and generatebase migrations

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

# 🧠 Technical Decisions & Features

Key design decisions implemented in the API:

- **Dependency Injection & Repository Pattern:**Services are decoupled from Prisma through repository abstractions, keeping business logic independent from infrastructure details.
- **Rate Limiting:**The API uses `@nestjs/throttler` to protect endpoints against excessive requests.
- **Redis Caching:**Frequently accessed resources, such as the car catalog, can be cached to improve performance.
- **Reservation Concurrency Control:**Database transactions and locking strategies prevent conflicting reservations for the same vehicle.
- **Historical Rental Values:**Final rental values are stored during reservation creation, preserving historical consistency even if prices change later.
- **Global Exception Filter:**Centralized exception handling provides consistent API responses.
- **JWT Authentication:**
  Stateless authentication using access tokens.

---

# 🧪 Testing

Run unit tests:

```bash
npm run test
```

Run coverage:

```bash
npm run test:cov
```

Run E2E tests:

```bash
npm run test:e2e
```

---

Developed by Monique Borges.
