import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserByContext } from './current-user.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

describe('CurrentUser Decorator', () => {
  const mockUser: AuthenticatedUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
  };

  const createMockContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should return the full authenticated user object when no key is specified', () => {
    const context = createMockContext(mockUser);
    const result = getCurrentUserByContext(undefined, context);
    expect(result).toEqual(mockUser);
  });

  it('should extract the "id" property when passed as argument', () => {
    const context = createMockContext(mockUser);
    const result = getCurrentUserByContext('id', context);
    expect(result).toBe(mockUser.id);
  });

  it('should extract the "email" property when passed as argument', () => {
    const context = createMockContext(mockUser);
    const result = getCurrentUserByContext('email', context);
    expect(result).toBe(mockUser.email);
  });

  it('should return undefined defensively when request.user is absent', () => {
    const context = createMockContext(undefined);
    const result = getCurrentUserByContext(undefined, context);
    expect(result).toBeUndefined();
  });

  it('should return undefined when requesting a property and request.user is absent', () => {
    const context = createMockContext(undefined);
    const result = getCurrentUserByContext('id', context);
    expect(result).toBeUndefined();
  });
});
