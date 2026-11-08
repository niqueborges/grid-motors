import { getJwtSecret } from './jwt.constants';

describe('getJwtSecret', () => {
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

  it('should return secret when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'valid-secret-key';
    expect(getJwtSecret()).toBe('valid-secret-key');
  });

  it('should throw Error when JWT_SECRET is undefined', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  });

  it('should throw Error when JWT_SECRET is an empty string', () => {
    process.env.JWT_SECRET = '';
    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  });

  it('should throw Error when JWT_SECRET contains only whitespace', () => {
    process.env.JWT_SECRET = '   ';
    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  });
});
