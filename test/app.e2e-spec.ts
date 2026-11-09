import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { ReservationsService } from '../src/reservations/reservations.service';
import { UsersService } from '../src/users/users.service';
import { CarsService } from '../src/cars/cars.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { UserEntity } from '../src/users/entities/user.entity';

interface ApiResponseError {
  statusCode: number;
  message: string | string[];
}

interface ApiCarResponse {
  id: string;
  color: string;
}

interface ApiUserSummaryResponse {
  id: string;
  name: string;
  qualified: string;
  cpf?: string;
  birth?: string;
  email?: string;
  password?: string;
}

interface ApiUserProfileResponse {
  id: string;
  name: string;
  cpf?: string;
  birth?: string;
  email?: string;
  cep?: string;
  qualified?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  password?: string;
}

interface ApiReservationResponse {
  id: string;
  start_date: string;
  end_date: string;
  carId: string;
  userId: string;
  final_value: number;
}

interface ApiPaginatedReservationsResponse {
  reserves: ApiReservationResponse[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

describe('Grid Motors API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let reservationsService: ReservationsService;
  let usersService: UsersService;
  let carsService: CarsService;
  let validBearerToken: string;
  let user1Id: string;
  let user1Token: string;
  let user2Id: string;
  let user2Token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'test-e2e-jwt-secret-key-grid-motors';

    // Ensure REDIS_HOST points to localhost if not set in environment
    if (!process.env.REDIS_HOST) {
      process.env.REDIS_HOST = 'localhost';
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    reservationsService =
      moduleFixture.get<ReservationsService>(ReservationsService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    carsService = moduleFixture.get<CarsService>(CarsService);

    validBearerToken = jwtService.sign({
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'e2e@example.com',
    });

    user1Id = '123e4567-e89b-12d3-a456-426614174001';
    user1Token = jwtService.sign({
      sub: user1Id,
      email: 'user1@example.com',
    });

    user2Id = '123e4567-e89b-12d3-a456-426614174002';
    user2Token = jwtService.sign({
      sub: user2Id,
      email: 'user2@example.com',
    });

    await app.init();
  });

  describe('Cars Auth Guard', () => {
    it('/api/v1/cars (GET) - should require authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/cars').expect(401);
    });
  });

  describe('I4: ParseUUIDPipe in Reservations', () => {
    const invalidId = 'not-a-valid-uuid';

    it('/api/v1/reservations/:id (GET) - should return HTTP 400 and not call service when ID is not a UUID', async () => {
      const spy = jest.spyOn(reservationsService, 'findOne');

      const response = await request(app.getHttpServer())
        .get(`/api/v1/reservations/${invalidId}`)
        .set('Authorization', `Bearer ${validBearerToken}`)
        .expect(400);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('/api/v1/reservations/:id (PATCH) - should return HTTP 400 and not call service when ID is not a UUID', async () => {
      const spy = jest.spyOn(reservationsService, 'update');

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/reservations/${invalidId}`)
        .set('Authorization', `Bearer ${validBearerToken}`)
        .send({ start_date: '20/04/2023' })
        .expect(400);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('/api/v1/reservations/:id (DELETE) - should return HTTP 400 and not call service when ID is not a UUID', async () => {
      const spy = jest.spyOn(reservationsService, 'remove');

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/reservations/${invalidId}`)
        .set('Authorization', `Bearer ${validBearerToken}`)
        .expect(400);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('I5: findByEmail & Uniform Login Responses', () => {
    it('/api/v1/auth/login (POST) - should return HTTP 401 when email does not exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent-user@example.com',
          password: 'password123',
        })
        .expect(401);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(401);
      expect(body.message).toBe('Invalid email or password');
    });

    it('/api/v1/auth/login (POST) - should return HTTP 401 with identical payload when password is wrong', async () => {
      const mockUser = new UserEntity({
        id: 'user-1',
        name: 'Existing User',
        email: 'existing@example.com',
        // Valid bcrypt hash of "correctPassword"
        password:
          '$2b$10$w8k2.tFf.nCsqBfJ1tV5x.t6G6fRkQzO1v2a3b4c5d6e7f8g9h0i.',
        cpf: '12345678901',
        birth: new Date('2000-01-01'),
        cep: '01001000',
        qualified: 'yes',
      });

      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'wrongPassword123',
        })
        .expect(401);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(401);
      expect(body.message).toBe('Invalid email or password');
    });
  });

  describe('N2: UpdateCarDto Accessories Rejection', () => {
    const validCarId = '123e4567-e89b-12d3-a456-426614174000';

    it('/api/v1/cars/:id (PATCH) - should reject payload containing accessories with HTTP 400', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/cars/${validCarId}`)
        .set('Authorization', `Bearer ${validBearerToken}`)
        .send({
          color: 'Silver',
          accessories: [{ description: 'Sunroof' }],
        })
        .expect(400);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(400);
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages).toContain('property accessories should not exist');
    });

    it('/api/v1/cars/:id (PATCH) - should accept valid car fields without accessories', async () => {
      const spy = jest.spyOn(carsService, 'update').mockResolvedValueOnce({
        id: validCarId,
        model: 'GM S10 2.8',
        color: 'Silver',
        year: 2021,
        value_per_day: 50,
        number_of_passengers: 5,
        accessories: [],
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/cars/${validCarId}`)
        .set('Authorization', `Bearer ${validBearerToken}`)
        .send({
          color: 'Silver',
        })
        .expect(200);

      const carBody = response.body as ApiCarResponse;
      expect(carBody.id).toBe(validCarId);
      expect(carBody.color).toBe('Silver');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Etapa 2: Users Endpoints - Authentication, Minimization, and Ownership', () => {
    it('/api/v1/users (POST) - should remain public and allow registration without JWT', async () => {
      const createDto = {
        name: 'Public Registered User',
        email: 'public@example.com',
        cpf: '13114786049',
        birth: '01/01/1990',
        cep: '01001-000',
        password: 'password123',
        qualified: 'yes',
      };
      const createdUser = new UserEntity({
        id: '123e4567-e89b-12d3-a456-426614174099',
        name: createDto.name,
        email: createDto.email,
        cpf: createDto.cpf,
        birth: new Date('1990-01-01'),
        cep: createDto.cep,
        qualified: createDto.qualified,
      });

      const spy = jest
        .spyOn(usersService, 'create')
        .mockResolvedValueOnce(createdUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(createDto)
        .expect(201);

      expect(spy).toHaveBeenCalled();
      const body = response.body as ApiUserProfileResponse;
      expect(body.name).toBe(createDto.name);
      expect(body.password).toBeUndefined();
      expect(response.body).not.toHaveProperty('password');
    });

    it('/api/v1/users (GET) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });

    it('/api/v1/users (GET) - should return minimal projection (id, name, qualified only) with valid JWT', async () => {
      const minimalUsers = [
        {
          id: user1Id,
          name: 'User One',
          qualified: 'yes',
        },
        {
          id: user2Id,
          name: 'User Two',
          qualified: 'no',
        },
      ];
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce(minimalUsers);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const users = response.body as ApiUserSummaryResponse[];
      expect(users).toHaveLength(2);
      for (const u of users) {
        expect(u.id).toBeDefined();
        expect(u.name).toBeDefined();
        expect(u.qualified).toBeDefined();
        expect(u.cpf).toBeUndefined();
        expect(u.birth).toBeUndefined();
        expect(u.email).toBeUndefined();
        expect(u.password).toBeUndefined();
        expect(u).not.toHaveProperty('cpf');
        expect(u).not.toHaveProperty('birth');
        expect(u).not.toHaveProperty('email');
        expect(u).not.toHaveProperty('password');
        expect(u).not.toHaveProperty('cep');
        expect(u).not.toHaveProperty('street');
      }
    });

    it('/api/v1/users/:id (GET) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${user1Id}`)
        .expect(401);
    });

    it('/api/v1/users/:id (GET) - should reject malformed UUID with HTTP 400', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('Validation failed (uuid is expected)');
    });

    it('/api/v1/users/:id (GET) - should return HTTP 403 when requesting profile of another user', async () => {
      // user1 attempts to query user2
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(403);

      // Symmetrically, user2 attempts to query user1
      const responseReciprocal = await request(app.getHttpServer())
        .get(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      const bodyReciprocal = responseReciprocal.body as ApiResponseError;
      expect(bodyReciprocal.statusCode).toBe(403);
    });

    it('/api/v1/users/:id (GET) - should return HTTP 200 with full profile and without password for own profile', async () => {
      const profile = {
        id: user1Id,
        name: 'User One',
        cpf: '13114786049',
        birth: new Date('1990-01-01'),
        email: 'user1@example.com',
        cep: '01001-000',
        street: 'Main Street',
        neighborhood: 'Downtown',
        city: 'City',
        state: 'ST',
        qualified: 'yes',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(profile);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const body = response.body as ApiUserProfileResponse;
      expect(body.id).toBe(user1Id);
      expect(body.name).toBe('User One');
      expect(body.email).toBe('user1@example.com');
      expect(body.password).toBeUndefined();
      expect(response.body).not.toHaveProperty('password');
    });

    it('/api/v1/users/:id (PATCH) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${user1Id}`)
        .send({ name: 'New Name' })
        .expect(401);
    });

    it('/api/v1/users/:id (PATCH) - should reject malformed UUID with HTTP 400', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'New Name' })
        .expect(400);
    });

    it('/api/v1/users/:id (PATCH) - should return HTTP 403 when updating another user profile', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Malicious Change' })
        .expect(403);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(403);
    });

    it('/api/v1/users/:id (PATCH) - should return HTTP 200 when updating own profile', async () => {
      const updatedUser = new UserEntity({
        id: user1Id,
        name: 'Updated Name',
        email: 'user1@example.com',
        cpf: '13114786049',
        birth: new Date('1990-01-01'),
        cep: '01001000',
        qualified: 'yes',
      });
      jest.spyOn(usersService, 'update').mockResolvedValueOnce(updatedUser);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const body = response.body as ApiUserProfileResponse;
      expect(body.id).toBe(user1Id);
      expect(body.name).toBe('Updated Name');
    });

    it('/api/v1/users/:id (DELETE) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${user1Id}`)
        .expect(401);
    });

    it('/api/v1/users/:id (DELETE) - should reject malformed UUID with HTTP 400', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('/api/v1/users/:id (DELETE) - should return HTTP 403 when deleting another user account', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      const body = response.body as ApiResponseError;
      expect(body.statusCode).toBe(403);
    });

    it('/api/v1/users/:id (DELETE) - should return HTTP 204 when deleting own user account', async () => {
      jest.spyOn(usersService, 'remove').mockResolvedValueOnce(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });
  });

  describe('Etapa 2: Reservations Endpoints - Ownership and Preservation of Queries', () => {
    const validCarId = '123e4567-e89b-12d3-a456-426614174099';
    const reservation1Id = '123e4567-e89b-12d3-a456-426614174011';
    const reservation2Id = '123e4567-e89b-12d3-a456-426614174022';

    it('/api/v1/reservations (POST) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/reservations')
        .send({
          start_date: '20/04/2023',
          end_date: '30/04/2023',
          id_car: validCarId,
        })
        .expect(401);
    });

    it('/api/v1/reservations (POST) - should bind reservation to authenticated user and reject body spoofing', async () => {
      const spy = jest
        .spyOn(reservationsService, 'create')
        .mockResolvedValueOnce({
          id: reservation1Id,
          start_date: new Date('2023-04-20'),
          end_date: new Date('2023-04-30'),
          carId: validCarId,
          userId: user1Id,
          final_value: 500,
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          start_date: '20/04/2023',
          end_date: '30/04/2023',
          id_car: validCarId,
        })
        .expect(201);

      expect(spy).toHaveBeenCalledWith(expect.any(Object), user1Id);
      const body = response.body as ApiReservationResponse;
      expect(body.userId).toBe(user1Id);
    });

    it('/api/v1/reservations (POST) - should reject non-whitelisted userId in body due to ValidationPipe', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          start_date: '20/04/2023',
          end_date: '30/04/2023',
          id_car: validCarId,
          userId: user2Id,
        })
        .expect(400);

      const body = response.body as ApiResponseError;
      const messages = Array.isArray(body.message)
        ? body.message
        : [body.message];
      expect(messages).toContain('property userId should not exist');
    });

    it('/api/v1/reservations (GET) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reservations')
        .expect(401);
    });

    it('/api/v1/reservations (GET) - should preserve query filters and pagination format without per-user filter', async () => {
      const paginatedResult = {
        reserves: [
          {
            id: reservation1Id,
            start_date: new Date('2023-04-20'),
            end_date: new Date('2023-04-30'),
            carId: validCarId,
            userId: user1Id,
            final_value: 500,
          },
          {
            id: reservation2Id,
            start_date: new Date('2023-05-01'),
            end_date: new Date('2023-05-10'),
            carId: validCarId,
            userId: user2Id,
            final_value: 500,
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
        offsets: 1,
      };
      jest
        .spyOn(reservationsService, 'findAll')
        .mockResolvedValueOnce(paginatedResult);

      const response = await request(app.getHttpServer())
        .get('/api/v1/reservations?limit=10&offset=0')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const body = response.body as ApiPaginatedReservationsResponse;
      expect(body.total).toBe(2);
      expect(body.reserves).toHaveLength(2);
      expect(body.limit).toBe(10);
    });

    it('/api/v1/reservations/:id (GET) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/reservations/${reservation1Id}`)
        .expect(401);
    });

    it('/api/v1/reservations/:id (GET) - should allow cross-user consultation without ownership restrictions (ADR-0003 §2.6)', async () => {
      const resOfUser2 = {
        id: reservation2Id,
        start_date: new Date('2023-05-01'),
        end_date: new Date('2023-05-10'),
        carId: validCarId,
        userId: user2Id,
        final_value: 500,
      };
      jest
        .spyOn(reservationsService, 'findOne')
        .mockResolvedValueOnce(resOfUser2);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const body = response.body as ApiReservationResponse;
      expect(body.id).toBe(reservation2Id);
      expect(body.userId).toBe(user2Id);
    });

    it('/api/v1/reservations/:id (PATCH) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/reservations/${reservation1Id}`)
        .send({ start_date: '21/04/2023' })
        .expect(401);
    });

    it('/api/v1/reservations/:id (PATCH) - should return HTTP 404 when reservation does not exist', async () => {
      jest
        .spyOn(reservationsService, 'update')
        .mockRejectedValueOnce(new NotFoundException('Reservation not found'));

      await request(app.getHttpServer())
        .patch(`/api/v1/reservations/${reservation1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ start_date: '21/04/2023' })
        .expect(404);
    });

    it('/api/v1/reservations/:id (PATCH) - should return HTTP 403 when updating third-party reservation', async () => {
      jest
        .spyOn(reservationsService, 'update')
        .mockRejectedValueOnce(
          new ForbiddenException(
            'You do not have permission to update this reservation',
          ),
        );

      await request(app.getHttpServer())
        .patch(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ start_date: '21/04/2023' })
        .expect(403);
    });

    it('/api/v1/reservations/:id (PATCH) - should return HTTP 200 when updating own reservation', async () => {
      const updatedRes = {
        id: reservation1Id,
        start_date: new Date('2023-04-21'),
        end_date: new Date('2023-04-30'),
        carId: validCarId,
        userId: user1Id,
        final_value: 450,
      };
      jest
        .spyOn(reservationsService, 'update')
        .mockResolvedValueOnce(updatedRes);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/reservations/${reservation1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ start_date: '21/04/2023' })
        .expect(200);

      const body = response.body as ApiReservationResponse;
      expect(body.id).toBe(reservation1Id);
    });

    it('/api/v1/reservations/:id (DELETE) - should require authentication (HTTP 401 without token)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/reservations/${reservation1Id}`)
        .expect(401);
    });

    it('/api/v1/reservations/:id (DELETE) - should return HTTP 404 when reservation does not exist', async () => {
      jest
        .spyOn(reservationsService, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Reservation not found'));

      await request(app.getHttpServer())
        .delete(`/api/v1/reservations/${reservation1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('/api/v1/reservations/:id (DELETE) - should return HTTP 403 when deleting third-party reservation', async () => {
      jest
        .spyOn(reservationsService, 'remove')
        .mockRejectedValueOnce(
          new ForbiddenException(
            'You do not have permission to delete this reservation',
          ),
        );

      await request(app.getHttpServer())
        .delete(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('/api/v1/reservations/:id (DELETE) - should return HTTP 204 when deleting own reservation', async () => {
      jest
        .spyOn(reservationsService, 'remove')
        .mockResolvedValueOnce(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/reservations/${reservation1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
