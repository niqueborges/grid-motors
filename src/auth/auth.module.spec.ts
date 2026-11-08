import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';

describe('AuthModule (Bootstrap Fail-Fast)', () => {
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
  });

  afterEach(() => {
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('should compile successfully when JWT_SECRET is set', async () => {
    process.env.JWT_SECRET = 'valid-test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider('IUsersRepository')
      .useValue({})
      .compile();

    expect(moduleRef).toBeDefined();
  });

  it('should fail during module compilation if JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(
      Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider('IUsersRepository')
        .useValue({})
        .compile(),
    ).rejects.toThrow(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  });

  it('should fail during module compilation if JWT_SECRET is empty', async () => {
    process.env.JWT_SECRET = '   ';

    await expect(
      Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider('IUsersRepository')
        .useValue({})
        .compile(),
    ).rejects.toThrow(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  });
});
