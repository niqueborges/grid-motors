
# Grid Motors

Welcome to the **Grid Motors API**. This is the final project for the Challenge | Bootcamp - AWS AI FDE BACK-END JOURNEY NODE.JS - AI/R BELONG_ABR26.

The goal of this project is to provide a complete RESTful API for managing car rentals, including user authentication, vehicle inventory, accessories, and reservation management with business rules.

[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

## 🛠 What's under the hood?

- **[Node.js](https://nodejs.org/en/)** (v20+) & **[NestJS](https://nestjs.com/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Prisma ORM](https://www.prisma.io/)** with **[PostgreSQL](https://www.postgresql.org/)**
- **[Redis](https://redis.io/)** for caching
- **[Docker &amp; Docker Compose](https://www.docker.com/)**
- **[Jest](https://jestjs.io/)** for unit and E2E testing
- **[Swagger](https://swagger.io/)** for API documentation
- **[Passport](http://www.passportjs.org/)** and **JWT** for authentication

## 🏗 Architecture & Folder Structure

The project follows a modular architecture inspired by Clean Architecture principles, keeping responsibilities separated and the codebase scalable.

```
grid-motors/
├── prisma/                 # Database schema and migrations
├── prisma.config.ts        # Prisma 7 configuration
├── src/
│   ├── auth/               # Authentication, JWT strategy and guards
│   ├── cars/               # Car and accessories management
│   ├── common/             # Global filters, validators and providers
│   ├── reservations/       # Rental business rules
│   ├── users/              # User management and external integrations
│   ├── main.ts             # Application entry point
│   └── app.module.ts
├── test/                   # E2E tests
├── .env.example            # Environment variables template
├── docker-compose.yml      # API, PostgreSQL and Redis services
└── Dockerfile              # Multi-stage production build
```

## 🚀 Running the Project

### Requirements

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

### Using Docker (recommended)

1. Clone the repository:

```bash
git clone https://github.com/niqueborges/grid-motors.git
cd grid-motors
```

2. Create your environment file:

```bash
cp .env.example .env
```

Adjust the variables if necessary.

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@db:5432/grid_motors?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
REDIS_HOST=redis
REDIS_PORT=6379
```

3. Build and start the containers:

```bash
docker compose up --build -d
```

The API will be available at:

```
http://localhost:3000/api/v1
```

Check running containers:

```bash
docker ps
```

### Running locally (without Docker for the API)

1. Install dependencies:

```bash
npm install
```

2. Start only the infrastructure services:

```bash
docker compose up -d db redis
```

3. Update your `.env` for local execution:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grid_motors?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

Note:

- Inside Docker, the API connects to PostgreSQL through `db:5432`.
- From your local machine, PostgreSQL is exposed through `localhost:5433`.

4. Run migrations:

```bash
npx prisma migrate dev
```

5. Start the application:

```bash
npm run start:dev
```

## 📚 API Documentation

Swagger documentation is available at:

```
http://localhost:3000/api/v1/api-docs
```

Authentication flow:

1. Create a user.
2. Login through:

```
POST /api/v1/auth/login
```

3. Copy the returned JWT token.
4. Click **Authorize** in Swagger and provide the token.

![Swagger UI](docs/swagger-ui.png)

## 🧠 Technical Decisions & Features

Key design decisions implemented in the API:

- **Dependency Injection & Repository Pattern:** Services do not depend directly on Prisma repositories. Interfaces are used to keep business logic decoupled from infrastructure details.
- **Rate Limiting:** The API uses `@nestjs/throttler` to protect endpoints against excessive requests.
- **Redis Caching:** Frequently accessed data, such as the car catalog, can be cached to improve performance.
- **Reservation Concurrency Control:** Reservation creation uses database transactions and locking strategies to prevent conflicting reservations for the same vehicle.
- **Historical Rental Values:** The final rental amount is stored at reservation creation time, preserving the original calculation even if prices change later.
- **Global Exception Filter:** A centralized exception handler provides consistent API error responses.
- **JWT Authentication:** The API uses stateless authentication with access tokens.

## 🧪 Testing

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
