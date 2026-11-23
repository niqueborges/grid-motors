import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUsersRepository } from './prisma-users.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PrismaUsersRepository', () => {
  let repository: PrismaUsersRepository;

  const mockPrismaUser = {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPrismaService = {
    user: mockPrismaUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUsersRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaUsersRepository>(PrismaUsersRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAllPaginated', () => {
    const mockUsers = [
      { id: 'user-1', name: 'Alice', qualified: 'yes' },
      { id: 'user-2', name: 'Bob', qualified: 'no' },
    ];

    it('should call findMany and count with correct skip, take, orderBy, and select', async () => {
      mockPrismaUser.findMany.mockResolvedValue(mockUsers);
      mockPrismaUser.count.mockResolvedValue(2);

      const params = { limit: 10, offset: 0 };
      const result = await repository.findAllPaginated(params);

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, qualified: true },
      });
      expect(mockPrismaUser.count).toHaveBeenCalledWith();
      expect(result).toEqual({
        users: mockUsers,
        total: 2,
      });
    });

    it('should apply custom skip and take based on offset and limit parameters', async () => {
      mockPrismaUser.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaUser.count.mockResolvedValue(45);

      const params = { limit: 25, offset: 50 };
      await repository.findAllPaginated(params);

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        }),
      );
    });

    it('should enforce deterministic ordering by name ASC and id ASC', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockResolvedValue(0);

      await repository.findAllPaginated({ limit: 10, offset: 0 });

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        }),
      );
    });

    it('should enforce strict projection selecting only id, name, and qualified', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockResolvedValue(0);

      await repository.findAllPaginated({ limit: 10, offset: 0 });

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true, qualified: true },
        }),
      );
    });

    it('should handle empty result when database has no users', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockResolvedValue(0);

      const result = await repository.findAllPaginated({
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        users: [],
        total: 0,
      });
    });

    it('should propagate errors when prisma.user.findMany throws', async () => {
      mockPrismaUser.findMany.mockRejectedValue(
        new Error('Prisma findMany query failure'),
      );
      mockPrismaUser.count.mockResolvedValue(0);

      await expect(
        repository.findAllPaginated({ limit: 10, offset: 0 }),
      ).rejects.toThrow('Prisma findMany query failure');
    });

    it('should propagate errors when prisma.user.count throws', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockRejectedValue(
        new Error('Prisma count query failure'),
      );

      await expect(
        repository.findAllPaginated({ limit: 10, offset: 0 }),
      ).rejects.toThrow('Prisma count query failure');
    });
  });

  describe('create', () => {
    it('should create a user and return a UserEntity instance', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        cpf: '12345678901',
        password: 'hash',
        birth: new Date('1990-01-01'),
        cep: '01001000',
        qualified: 'yes',
      };
      const createdRecord = { id: 'user-uuid-1', ...userData };
      mockPrismaUser.create.mockResolvedValue(createdRecord);

      const result = await repository.create(userData);

      expect(mockPrismaUser.create).toHaveBeenCalledWith({
        data: userData,
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('user-uuid-1');
      expect(result.name).toBe('John Doe');
    });
  });

  describe('findById', () => {
    it('should return UserEntity when user exists', async () => {
      const mockUser = { id: 'u1', name: 'User 1', email: 'u1@test.com' };
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('u1');

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe('u1');
    });

    it('should return null when user is not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return UserEntity when user with email exists', async () => {
      const mockUser = { id: 'u2', email: 'test@example.com' };
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result?.id).toBe('u2');
    });

    it('should return null when email does not exist', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrCpf', () => {
    it('should return null immediately when both email and cpf are omitted', async () => {
      const result = await repository.findByEmailOrCpf();

      expect(result).toBeNull();
      expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
    });

    it('should query OR with only email when cpf is undefined', async () => {
      const mockUser = { id: 'u3', email: 'test@test.com' };
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmailOrCpf(
        'test@test.com',
        undefined,
      );

      expect(mockPrismaUser.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'test@test.com' }],
        },
      });
      expect(result?.id).toBe('u3');
    });

    it('should query OR with only cpf when email is undefined', async () => {
      const mockUser = { id: 'u4', cpf: '11122233344' };
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmailOrCpf(
        undefined,
        '11122233344',
      );

      expect(mockPrismaUser.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ cpf: '11122233344' }],
        },
      });
      expect(result?.id).toBe('u4');
    });

    it('should query OR with both email and cpf when both are provided', async () => {
      const mockUser = { id: 'u5', email: 'a@b.com', cpf: '99988877766' };
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmailOrCpf(
        'a@b.com',
        '99988877766',
      );

      expect(mockPrismaUser.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'a@b.com' }, { cpf: '99988877766' }],
        },
      });
      expect(result?.id).toBe('u5');
    });

    it('should return null when findFirst finds no user', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmailOrCpf('nobody@test.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should call prisma.user.update with where and data and return UserEntity', async () => {
      const updateData = { name: 'New Name' };
      const updatedUser = { id: 'u1', name: 'New Name' };
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const result = await repository.update('u1', updateData);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: updateData,
      });
      expect(result.id).toBe('u1');
      expect(result.name).toBe('New Name');
    });
  });

  describe('delete', () => {
    it('should call prisma.user.delete with where id', async () => {
      mockPrismaUser.delete.mockResolvedValue({ id: 'u1' });

      await repository.delete('u1');

      expect(mockPrismaUser.delete).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
    });
  });
});
