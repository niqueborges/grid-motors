import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailOrCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAddressProvider = {
    getAddressByCep: jest.fn(),
  };

  const mockHashProvider = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUsersRepository',
          useValue: mockUsersRepository,
        },
        {
          provide: 'IAddressProvider',
          useValue: mockAddressProvider,
        },
        {
          provide: 'IHashProvider',
          useValue: mockHashProvider,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  const validCreateDto: CreateUserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    cpf: '12345678901',
    password: 'password123',
    birth: '01/01/1990',
    cep: '12345678',
    qualified: 'yes',
  };

  const mockAddress = {
    street: 'Test Street',
    neighborhood: 'Test Neigh',
    city: 'Test City',
    state: 'TS',
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      mockAddressProvider.getAddressByCep.mockResolvedValue(mockAddress);
      mockUsersRepository.findByEmailOrCpf.mockResolvedValue(null);
      mockHashProvider.hash.mockResolvedValue('hashedPassword');

      const expectedUser = {
        id: '1',
        ...validCreateDto,
        password: 'hashedPassword',
        birth: new Date(1990, 0, 1),
        ...mockAddress,
      };
      mockUsersRepository.create.mockResolvedValue(expectedUser);

      const result = await service.create(validCreateDto);

      expect(result).toEqual(expectedUser);
      expect(mockAddressProvider.getAddressByCep).toHaveBeenCalledWith(
        validCreateDto.cep,
      );
      expect(mockHashProvider.hash).toHaveBeenCalledWith(
        validCreateDto.password,
      );
      expect(mockUsersRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if CEP is invalid', async () => {
      mockAddressProvider.getAddressByCep.mockResolvedValue(null);

      await expect(service.create(validCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user email or cpf already exists', async () => {
      mockAddressProvider.getAddressByCep.mockResolvedValue(mockAddress);
      mockUsersRepository.findByEmailOrCpf.mockResolvedValue({
        id: 'existing',
      });

      await expect(service.create(validCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return minimal projection (id, name, qualified) and omit sensitive/cadastral data', async () => {
      const mockFullUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        cpf: '12345678901',
        birth: new Date('1990-01-01'),
        email: 'john@example.com',
        password: 'hashed-password',
        cep: '01001000',
        street: 'Main Street',
        neighborhood: 'Downtown',
        city: 'City',
        state: 'ST',
        qualified: 'yes',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsersRepository.findAll.mockResolvedValue([mockFullUser]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          qualified: 'yes',
        },
      ]);
      expect(result[0]).not.toHaveProperty('cpf');
      expect(result[0]).not.toHaveProperty('birth');
      expect(result[0]).not.toHaveProperty('email');
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('cep');
      expect(result[0]).not.toHaveProperty('street');
      expect(result[0]).not.toHaveProperty('neighborhood');
      expect(result[0]).not.toHaveProperty('city');
      expect(result[0]).not.toHaveProperty('state');
      expect(result[0]).not.toHaveProperty('createdAt');
      expect(result[0]).not.toHaveProperty('updatedAt');
    });
  });

  describe('findById', () => {
    it('should return a user entity if found', async () => {
      const mockUser = { id: '1', name: 'John Doe' };
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null if user is not found', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
      expect(mockUsersRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if id does not match currentUserId without querying repository', async () => {
      await expect(service.findOne('user-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUsersRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('1', '1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return user profile without password if found and owner', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        cpf: '12345678901',
        birth: new Date('1990-01-01'),
        email: 'john@example.com',
        password: 'hashed-secret-password',
        cep: '01001000',
        street: 'Main Street',
        neighborhood: 'Downtown',
        city: 'City',
        state: 'ST',
        qualified: 'yes',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne('1', '1');

      expect(result).toEqual({
        id: '1',
        name: 'John Doe',
        cpf: '12345678901',
        birth: new Date('1990-01-01'),
        email: 'john@example.com',
        cep: '01001000',
        qualified: 'yes',
        street: 'Main Street',
        neighborhood: 'Downtown',
        city: 'City',
        state: 'ST',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
      expect(result).not.toHaveProperty('password');
      expect(mockUsersRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@a.com',
      });
      const result = await service.findByEmail('a@a.com');
      expect(result).toEqual({ id: '1', email: 'a@a.com' });
    });

    it('should return null if user is not found by email', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@a.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if id does not match currentUserId without querying repository', async () => {
      await expect(
        service.update('user-1', { name: 'test' }, 'user-2'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      await expect(service.update('1', { name: 'test' }, '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if new email/cpf belongs to another user', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: '1' });
      mockUsersRepository.findByEmailOrCpf.mockResolvedValue({ id: '2' });

      await expect(
        service.update('1', { email: 'test@example.com' }, '1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user successfully', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: '1' });
      mockUsersRepository.findByEmailOrCpf.mockResolvedValue(null);
      mockAddressProvider.getAddressByCep.mockResolvedValue(mockAddress);
      mockHashProvider.hash.mockResolvedValue('newHashed');

      const updateDto: UpdateUserDto = {
        name: 'New Name',
        password: 'newPass',
        birth: '02/02/2000',
        cep: '87654321',
      };

      const expectedUpdated = { id: '1', name: 'New Name' };
      mockUsersRepository.update.mockResolvedValue(expectedUpdated);

      const result = await service.update('1', updateDto, '1');
      expect(result).toEqual(expectedUpdated);
      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        '1',
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if update cep is invalid', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: '1' });
      mockUsersRepository.findByEmailOrCpf.mockResolvedValue(null);
      mockAddressProvider.getAddressByCep.mockResolvedValue(null);

      await expect(
        service.update('1', { cep: 'invalid' }, '1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if id does not match currentUserId without querying repository', async () => {
      await expect(service.remove('user-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUsersRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user to remove does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      await expect(service.remove('1', '1')).rejects.toThrow(NotFoundException);
    });

    it('should delete user successfully', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: '1' });
      await service.remove('1', '1');
      expect(mockUsersRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
