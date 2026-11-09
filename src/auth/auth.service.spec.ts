import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockHashProvider = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: 'IHashProvider', useValue: mockHashProvider },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-password',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockHashProvider.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toEqual({ id: '1', email: 'test@test.com' });
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toBeNull();
    });

    it('should return null if password is wrong', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed-password',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockHashProvider.compare.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@test.com',
        'wrong-password',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      } as unknown as Omit<UserEntity, 'password'>);
      mockJwtService.sign.mockReturnValue('fake-token');

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result).toEqual({
        access_token: 'fake-token',
        refresh_token: 'fake-token',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with identical message when email is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException with identical message when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed-password',
      });
      mockHashProvider.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password' }),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({
        type: 'refresh',
        sub: 'user-id-1',
        email: 'test@test.com',
      });
      mockUsersService.findById.mockResolvedValue({
        id: 'user-id-1',
        email: 'test@test.com',
      });
      mockJwtService.sign.mockReturnValue('new-token');

      const result = await service.refreshToken('valid-refresh-token');
      expect(result).toEqual({
        access_token: 'new-token',
        refresh_token: 'new-token',
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-id-1');
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow();
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      mockJwtService.verify.mockReturnValue({
        type: 'access',
        sub: 'user-id-1',
        email: 'test@test.com',
      });

      await expect(service.refreshToken('access-type-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw UnauthorizedException when user is not found after verification', async () => {
      mockJwtService.verify.mockReturnValue({
        type: 'refresh',
        sub: 'non-existent-user',
        email: 'ghost@test.com',
      });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('valid-format-token')).rejects.toThrow(
        'Invalid refresh token',
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(
        'non-existent-user',
      );
    });
  });
});
