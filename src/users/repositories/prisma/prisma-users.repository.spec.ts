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
});
