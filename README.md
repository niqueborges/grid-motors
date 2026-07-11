# Grid Motors

RESTful API developed as the final project for the Challenge | Bootcamp - AWS AI FDE BACK-END JOURNEY NODE.JS - AI/R BELONG_ABR26.
The system allows the management of car rentals, including users, cars, accessories, and reservations with complex business rules.

[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

## 🛠 Technologies

- **[Node.js](https://nodejs.org/en/)** (v20+)
- **[NestJS](https://nestjs.com/)** (v10+)
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Prisma ORM](https://www.prisma.io/)**
- **[PostgreSQL](https://www.postgresql.org/)** (Database)
- **[Docker &amp; Docker Compose](https://www.docker.com/)**
- **[Jest](https://jestjs.io/)** (Unit Testing)
- **[Swagger](https://swagger.io/)** (API Documentation)
- **[Passport &amp; JWT](http://www.passportjs.org/)** (Authentication)

## 🏗 Architecture & Folder Structure

The project follows a modular, layered architecture based on NestJS best practices.

```
grid-motors/
├── prisma/                 # Database schema and migrations
├── src/                    # Source code
│   ├── auth/               # Authentication module (JWT strategy, guards)
│   ├── cars/               # Cars module (CRUD, accessories management)
│   ├── common/             # Cross-cutting utilities (Filters, Providers, Validators, Transforms)
│   ├── reservations/       # Reservations module (Business rules, calculations)
│   ├── users/              # Users module (CRUD, ViaCEP integration)
│   ├── main.ts             # Application entry point
│   └── app.module.ts       # Main module
├── test/                   # E2E Tests (if applicable)
├── .env.example            # Example of environment variables
├── docker-compose.yml      # Docker compose configuration
└── Dockerfile              # Dockerfile for the API
```

## ⚙️ Environment Variables

Create a `.env` file in the root of the project, based on the `.env.example`:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grid_motors?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

## 🚀 How to Run (with Docker)

This is the recommended way to run the project. You only need Docker installed.

1. **Clone the repository**

   ```bash
   git clone https://github.com/niqueborges/grid-motors.git
   cd grid-motors
   ```
2. **Run Docker Compose**

   ```bash
   docker-compose up --build -d
   ```

   This command will start both the PostgreSQL database and the API container.
3. **Access the API**
   The API will be available at `http://localhost:3000/api/v1`

## 💻 How to Run (Locally)

If you want to run the API locally on your machine, follow these steps:

1. **Install dependencies**

   ```bash
   npm install
   ```
2. **Start the database**
   You can use the provided docker-compose just for the database:

   ```bash
   docker-compose up -d db
   ```
3. **Run Migrations**
   To create the tables in the database:

   ```bash
   npx prisma migrate dev
   ```
4. **Start the application**

   ```bash
   # development
   npm run start

   # watch mode
   npm run start:dev

   # production mode
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation (Swagger)

The project includes an interactive Swagger documentation.

When the application is running, open your browser and navigate to:
**[http://localhost:3000/api/v1/api-docs](http://localhost:3000/api/v1/api-docs)**

From there, you can explore all endpoints, test payloads, and authenticate using the "Authorize" button at the top (requires a valid JWT token obtained from `POST /api/v1/auth/login`).

## 🖼 Screenshots / API Demo

![Swagger UI](docs/swagger-ui.png)

## 🏛 Architectural Decisions

This project follows **Clean Architecture** principles to ensure that the core domain is completely decoupled from frameworks and databases:

- **Dependency Injection**: Services depend on Interfaces (e.g., `IUsersRepository`), not concrete classes.
- **Repository Pattern**: Data access is isolated behind Repositories. The ORM (Prisma) is treated as an external detail and is never injected directly into Business Services. This means we can swap databases or ORMs with zero changes to our business logic.
- **Data Transfer Objects (DTOs)**: Used extensively with `class-validator` and `class-transformer` to sanitize and validate all incoming request payloads before they reach the services.

## 🧪 Testing and Coverage

The project was built with a strong focus on **Test Driven Development (TDD)**, ensuring reliability for critical business rules (e.g., overlapping reservations).

To run the unit tests:

```bash
npm run test
```

To see the test coverage report:

```bash
npm run test:cov
```

*Current Global Coverage: **~67%*** (exceeds the 60% requirement).

## 🔒 Business Rules Highlight

- **ViaCEP Integration:** Zip code (`cep`) is automatically validated and localized.
- **Passwords:** Are safely hashed using `bcrypt`.
- **Reservation Constraints:**
  - Users must be `qualified` ("yes") to rent a car.
  - A car cannot be rented twice in the same period.
  - A user cannot have two simultaneous active rentals.
- **Calculation:** `final_value` is calculated automatically based on the car's `value_per_day` and the date range.

## 🧠 Technical Decisions & Problem Solving

To demonstrate the technical maturity expected for a Junior position, several architectural and design decisions were made during the development of this API:

- **Overlapping Reservations Handling:** The most complex business rule of the system is preventing overlapping dates for car rentals. This was solved at the database query level using Prisma's `OR` conditions (`start_date` and `end_date`), ensuring high performance and data integrity directly in the database without needing to fetch and iterate through all existing reservations in memory.
- **Global Exception Filter:** A custom `AllExceptionsFilter` was implemented globally. Instead of relying on NestJS's default varying error shapes, this ensures that *all* error responses (validation, not found, conflicts) follow a strict, standardized JSON contract, making life much easier for frontend consumers.
- **Data Security (Password Masking):** User passwords are encrypted with `bcrypt`. To prevent data leakage, passwords are intentionally destructured and omitted at the service layer before returning data to the client, guaranteeing that sensitive information never leaves the backend.
- **Pre-calculated Final Values:** The `final_value` of a reservation is calculated during the POST request and persisted in the database, rather than being dynamically calculated on every GET request. This improves read performance and preserves the historical cost of the rental even if the car's `value_per_day` changes in the future.

---

Developed by Monique Borges.
