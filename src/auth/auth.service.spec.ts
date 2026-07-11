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
  };

  const mockJwtService = {
    sign: jest.fn(),
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
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: '1',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password' }),
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
