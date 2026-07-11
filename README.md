[![NestJS CI](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml/badge.svg)](https://github.com/niqueborges/grid-motors/actions/workflows/ci.yml)

# Grid Motors - REST API

## Project Description

This project is the final backend development challenge for **Grid Motors**, a vehicle rental dealership. The goal is to build a complete REST API for managing cars, reservations, users, and authentication.

## Main Features

- **Authentication**: Login system that generates a `Bearer Token`.
- **Cars**: Create, list (with pagination and filters), update, retrieve by ID, delete, and manage accessories. Car routes require authentication.
- **Users**: Create users (including address lookup via the ViaCEP API from postal code), update, delete, retrieve by ID, and list. Includes minimum age validation (18 years) and unique CPF and email constraints.
- **Reservations**: Create a reservation for a user and a car over a specific period. Includes listing, retrieve by ID, update, and delete. Prevents overlapping reservations for the same car.

## Technologies and Tools

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Local Infrastructure**: Docker and Docker Compose
- **API Documentation**: Swagger
- **Testing**: Jest
- **Code Quality**: ESLint and Prettier

## Running Locally

### Prerequisites

- Node.js (recommended 18+)
- NPM or Yarn
- Docker and Docker Compose (for the database)

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/niqueborges/grid-motors.git
   cd grid-motors
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the database containers:**

   ```bash
   docker-compose up -d
   ```

   _(Make sure to configure required environment variables in `.env` with database credentials.)_

4. **Start the application in development mode:**

   ```bash
   npm run start:dev
   ```

5. **Open the API documentation:**

   The app will run on port 3000. Visit:
   [http://localhost:3000/api/v1/api-docs](http://localhost:3000/api/v1/api-docs)

## Running Tests

To run unit tests and coverage:

```bash
npm run test
npm run test:cov
```
