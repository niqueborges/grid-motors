import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

describe('Grid Motors API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let reservationsService: ReservationsService;
  let usersService: UsersService;
  let carsService: CarsService;
  let validBearerToken: string;

  beforeAll(async () => {
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

  afterAll(async () => {
    await app.close();
  });
});
