/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return the user when no error and user is present', () => {
      const user = { id: 'user-1', email: 'test@test.com' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException when user is falsy and no error', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        'Missing or invalid JWT token',
      );
    });

    it('should re-throw the original Error instance when err is an Error', () => {
      const originalError = new Error('JWT expired');
      expect(() => guard.handleRequest(originalError, null, null)).toThrow(
        originalError,
      );
    });

    it('should throw UnauthorizedException when err is truthy but not an Error instance', () => {
      expect(() =>
        guard.handleRequest('some string error', null, null),
      ).toThrow(UnauthorizedException);
    });
  });
});
