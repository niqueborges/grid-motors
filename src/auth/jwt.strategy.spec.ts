import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', () => {
      const payload = { sub: 'user-id-1', email: 'user@example.com' };
      const result = strategy.validate(payload);
      expect(result).toEqual({ id: 'user-id-1', email: 'user@example.com' });
    });

    it('should map sub to id', () => {
      const payload = { sub: 'abc-123', email: 'test@test.com' };
      const result = strategy.validate(payload);
      expect(result.id).toBe('abc-123');
    });

    it('should map email correctly', () => {
      const payload = { sub: 'xyz', email: 'another@example.com' };
      const result = strategy.validate(payload);
      expect(result.email).toBe('another@example.com');
    });
  });
});
