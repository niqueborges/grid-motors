import {
  ValidationPipe,
  ArgumentMetadata,
  HttpException,
} from '@nestjs/common';
import { UpdateCarDto } from './update-car.dto';

interface ValidationErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

describe('UpdateCarDto (Validation & Schema)', () => {
  let targetPipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: UpdateCarDto,
    data: '',
  };

  beforeEach(() => {
    targetPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('should accept valid partial car fields', async () => {
    const validPayload = {
      color: 'Midnight Blue',
      value_per_day: 85,
    };

    const transformed = (await targetPipe.transform(
      validPayload,
      metadata,
    )) as UpdateCarDto;
    expect(transformed).toEqual(validPayload);
    expect(transformed).toBeInstanceOf(UpdateCarDto);
  });

  it('should reject payload containing accessories with HTTP 400', async () => {
    const payloadWithAccessories = {
      color: 'Midnight Blue',
      accessories: [{ description: 'Sunroof' }],
    };

    try {
      await targetPipe.transform(payloadWithAccessories, metadata);
      fail('Expected ValidationPipe to throw BadRequestException');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(400);
      const response = httpError.getResponse() as ValidationErrorResponse;
      const messages = Array.isArray(response.message)
        ? response.message
        : [response.message];
      expect(messages).toContain('property accessories should not exist');
    }
  });

  it('should reject unwhitelisted arbitrary fields with HTTP 400', async () => {
    const payloadWithUnknownField = {
      model: 'Sedan',
      unrecognizedField: 'invalid',
    };

    try {
      await targetPipe.transform(payloadWithUnknownField, metadata);
      fail('Expected ValidationPipe to throw BadRequestException');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(400);
      const response = httpError.getResponse() as ValidationErrorResponse;
      const messages = Array.isArray(response.message)
        ? response.message
        : [response.message];
      expect(messages).toContain('property unrecognizedField should not exist');
    }
  });

  it('should not include accessories property in Swagger metadata', () => {
    const instance = new UpdateCarDto();
    const ownKeys = Object.keys(instance);
    expect(ownKeys).not.toContain('accessories');
  });
});
