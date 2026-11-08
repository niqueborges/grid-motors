import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { ReservationsService } from '../src/reservations/reservations.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

interface ApiResponseError {
  statusCode: number;
  message: string | string[];
}

describe('Grid Motors API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let reservationsService: ReservationsService;
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

  afterAll(async () => {
    await app.close();
  });
});
