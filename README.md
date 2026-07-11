# Grid Motors

Welcome to the **Grid Motors** API. This is the final project for the Challenge | Bootcamp - AWS AI FDE BACK-END JOURNEY NODE.JS - AI/R BELONG_ABR26. 

The goal of this project is to provide a complete RESTful API to manage car rentals, handling everything from user registration and car inventory to complex reservation rules. 

[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

## 🛠 What's under the hood?

- **[Node.js](https://nodejs.org/en/)** (v20+) & **[NestJS](https://nestjs.com/)** (v10+)
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Prisma ORM](https://www.prisma.io/)** with **[PostgreSQL](https://www.postgresql.org/)**
- **[Redis](https://redis.io/)** for Caching
- **[Docker & Docker Compose](https://www.docker.com/)**
- **[Jest](https://jestjs.io/)** for Unit and E2E Testing
- **[Swagger](https://swagger.io/)** for the API documentation
- **[Passport & JWT](http://www.passportjs.org/)** for Authentication

## 🏗 Architecture & Folder Structure

The project follows a modular architecture inspired by Clean Architecture principles, ensuring the codebase remains organized and scalable:

```
grid-motors/
├── prisma/                 # Database schema and migrations
├── src/                    
│   ├── auth/               # JWT strategy, guards, and token refresh logic
│   ├── cars/               # Car and accessories management
│   ├── common/             # Global filters, validators, and custom providers
│   ├── reservations/       # The core business logic for rentals
│   ├── users/              # User management and ViaCEP integration
│   ├── main.ts             # Application entry point
│   └── app.module.ts       
├── test/                   # E2E test setup
├── .env.example            # Environment variables template
├── docker-compose.yml      # DB and API containers
└── Dockerfile              # Multi-stage build for production
```

## 🚀 Running the Project

The easiest way to get this up and running is using Docker.

1. **Clone the repo**
   ```bash
   git clone https://github.com/niqueborges/grid-motors.git
   cd grid-motors
   ```

2. **Set up your environment variables**
   Create a `.env` file in the root folder based on `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@db:5432/grid_motors?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   ```

3. **Spin up the containers**
   ```bash
   docker-compose up --build -d
   ```
   *Note: This uses a multi-stage Dockerfile, so it will build a lean production-ready image for the API along with the Postgres database.*

The API will be available at `http://localhost:3000/api/v1`.

### Running Locally (Without Docker for the API)

If you prefer to run the Node app locally:
1. `npm install`
2. Spin up just the database: `docker-compose up -d db`
3. Make sure your `.env` points `DATABASE_URL` to `localhost:5433` (the port exposed by docker-compose).
4. Run migrations: `npx prisma migrate dev`
5. Start the app: `npm run start:dev`

## 📚 API Documentation

Swagger is configured for easy endpoint testing. Once the app is running, access:
**[http://localhost:3000/api/v1/api-docs](http://localhost:3000/api/v1/api-docs)**

A user must be created and authenticated (`POST /api/v1/auth/login`) to obtain a JWT token. Use the "Authorize" button at the top of the Swagger page to inject the token into subsequent requests.

![Swagger UI](docs/swagger-ui.png)

## 🧠 Technical Decisions & Features

Several key design decisions and advanced features were implemented to ensure the system is robust and scalable:

- **Dependency Injection & Repository Pattern:** Business services do not depend directly on Prisma. By using interfaces (like `IUsersRepository`), the domain is decoupled from the ORM.
- **Rate Limiting:** The API is protected by `@nestjs/throttler` to prevent brute-force attacks and ensure fair usage.
- **Caching:** Redis is used to cache read-heavy endpoints like the car catalog, significantly improving response times.
- **Concurrency Control & Overlapping Reservations:** To prevent race conditions when concurrent reservations are made for the same car, database-level locking (`SELECT FOR UPDATE`) is used alongside interactive Prisma transactions. This guarantees data integrity without relying on in-memory locks.
- **Pre-calculated Final Values:** The `final_value` of a rental is calculated at creation time and stored in the database, acting as a historical snapshot immune to future price changes.
- **Global Exception Filter:** A custom `AllExceptionsFilter` handles exceptions uniformly, ensuring consistent JSON responses across all endpoints.
- **Stateless Refresh Tokens:** To maintain secure sessions without forcing frequent re-authentication, the API issues both an `access_token` and a `refresh_token`.

## 🧪 Testing

The project is built with reliability in mind. Unit tests can be executed with:
```bash
npm run test
```
To check coverage:
```bash
npm run test:cov
```
There is also a basic E2E setup validating the application bootstrap and global route protection (`npm run test:e2e`).

---
Developed by Monique Borges.
