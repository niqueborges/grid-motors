import { Test, TestingModule } from '@nestjs/testing';
import { PrismaReservationsRepository } from './prisma-reservations.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationEntity } from '../entities/reservation.entity';

describe('PrismaReservationsRepository', () => {
  let repository: PrismaReservationsRepository;

  const mockPrismaReservation = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTxReservation = {
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockTx = {
    $executeRaw: jest.fn(),
    reservation: mockTxReservation,
  };

  const mockPrismaService = {
    reservation: mockPrismaReservation,
    $transaction: jest.fn((cb: (tx: any) => Promise<any>) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaReservationsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaReservationsRepository>(
      PrismaReservationsRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create reservation with valid fields', async () => {
      const entity: ReservationEntity = {
        start_date: new Date('2026-05-01'),
        end_date: new Date('2026-05-05'),
        final_value: 500,
        userId: 'user-uuid',
        carId: 'car-uuid',
      };

      const created = { id: 'res-1', ...entity };
      mockPrismaReservation.create.mockResolvedValue(created);

      const result = await repository.create(entity);

      expect(mockPrismaReservation.create).toHaveBeenCalledWith({
        data: {
          start_date: entity.start_date,
          end_date: entity.end_date,
          final_value: 500,
          userId: 'user-uuid',
          carId: 'car-uuid',
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should apply defaults and return paginated result with no filters', async () => {
      const mockList = [{ id: 'res-1', final_value: 300 }];
      mockPrismaReservation.findMany.mockResolvedValue(mockList);
      mockPrismaReservation.count.mockResolvedValue(1);

      const result = await repository.findAll({});

      expect(mockPrismaReservation.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
      });
      expect(mockPrismaReservation.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        reserves: mockList,
        total: 1,
        limit: 10,
        offset: 0,
        offsets: 1,
      });
    });

    it('should apply all filters when provided', async () => {
      mockPrismaReservation.findMany.mockResolvedValue([]);
      mockPrismaReservation.count.mockResolvedValue(0);

      const startDate = new Date('2026-06-01');
      const endDate = new Date('2026-06-10');

      const result = await repository.findAll({
        id_user: 'user-1',
        id_car: 'car-1',
        start_date: startDate,
        end_date: endDate,
        final_value: 1000,
        limit: 20,
        offset: 40,
      });

      const expectedWhere = {
        userId: 'user-1',
        carId: 'car-1',
        start_date: { gte: startDate },
        end_date: { lte: endDate },
        final_value: 1000,
      };

      expect(mockPrismaReservation.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 40,
        take: 20,
      });
      expect(mockPrismaReservation.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result.offsets).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find unique reservation by id', async () => {
      const mockRes = { id: 'res-1', final_value: 400 };
      mockPrismaReservation.findUnique.mockResolvedValue(mockRes);

      const result = await repository.findById('res-1');

      expect(mockPrismaReservation.findUnique).toHaveBeenCalledWith({
        where: { id: 'res-1' },
      });
      expect(result).toEqual(mockRes);
    });

    it('should return null when not found', async () => {
      mockPrismaReservation.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should sanitize protected audit fields and update reservation', async () => {
      const dataToUpdate = {
        id: 'should-be-removed',
        createdAt: new Date(),
        updatedAt: new Date(),
        final_value: 750,
      };

      const updated = { id: 'res-1', final_value: 750 };
      mockPrismaReservation.update.mockResolvedValue(updated);

      const result = await repository.update('res-1', dataToUpdate);

      expect(mockPrismaReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { final_value: 750 },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete reservation by id', async () => {
      mockPrismaReservation.delete.mockResolvedValue({ id: 'res-1' });

      await repository.delete('res-1');

      expect(mockPrismaReservation.delete).toHaveBeenCalledWith({
        where: { id: 'res-1' },
      });
    });
  });

  describe('createWithCarLock', () => {
    const data: ReservationEntity = {
      start_date: new Date('2026-07-01'),
      end_date: new Date('2026-07-05'),
      final_value: 500,
      userId: 'user-lock-1',
      carId: 'car-lock-1',
    };

    it('should acquire car lock and create reservation when no overlaps exist', async () => {
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(0) // user overlap count
        .mockResolvedValueOnce(0); // car overlap count

      const created = { id: 'res-locked-1', ...data };
      mockTxReservation.create.mockResolvedValue(created);

      const result = await repository.createWithCarLock(data);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.$executeRaw).toHaveBeenCalled();
      expect(mockTxReservation.count).toHaveBeenCalledTimes(2);
      expect(mockTxReservation.create).toHaveBeenCalledWith({
        data: {
          start_date: data.start_date,
          end_date: data.end_date,
          final_value: data.final_value,
          userId: data.userId,
          carId: data.carId,
        },
      });
      expect(result).toEqual(created);
    });

    it('should throw USER_OVERLAP if user already has an overlapping reservation', async () => {
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(1) // user overlap count > 0
        .mockResolvedValueOnce(0);

      await expect(repository.createWithCarLock(data)).rejects.toThrow(
        'USER_OVERLAP',
      );
      expect(mockTxReservation.create).not.toHaveBeenCalled();
    });

    it('should throw CAR_OVERLAP if car is already reserved in that period', async () => {
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(0) // user overlap count
        .mockResolvedValueOnce(1); // car overlap count > 0

      await expect(repository.createWithCarLock(data)).rejects.toThrow(
        'CAR_OVERLAP',
      );
      expect(mockTxReservation.create).not.toHaveBeenCalled();
    });
  });

  describe('updateWithCarLock', () => {
    const existing = {
      id: 'res-update-1',
      start_date: new Date('2026-07-01'),
      end_date: new Date('2026-07-05'),
      final_value: 500,
      userId: 'user-owner',
      carId: 'car-original',
    };

    it('should throw NOT_FOUND when reservation does not exist', async () => {
      mockTxReservation.findUnique.mockResolvedValue(null);

      await expect(
        repository.updateWithCarLock('non-existent', { final_value: 600 }),
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should successfully update reservation when no overlaps exist', async () => {
      mockTxReservation.findUnique.mockResolvedValue(existing);
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(0) // user overlap count
        .mockResolvedValueOnce(0); // car overlap count

      const updated = { ...existing, final_value: 650 };
      mockTxReservation.update.mockResolvedValue(updated);

      const result = await repository.updateWithCarLock('res-update-1', {
        final_value: 650,
      });

      expect(mockTxReservation.findUnique).toHaveBeenCalledWith({
        where: { id: 'res-update-1' },
      });
      expect(mockTx.$executeRaw).toHaveBeenCalled();
      expect(mockTxReservation.count).toHaveBeenCalledTimes(2);
      expect(mockTxReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-update-1' },
        data: { final_value: 650 },
      });
      expect(result).toEqual(updated);
    });

    it('should throw USER_OVERLAP when update causes user schedule conflict', async () => {
      mockTxReservation.findUnique.mockResolvedValue(existing);
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(1) // user overlap count > 0
        .mockResolvedValueOnce(0);

      await expect(
        repository.updateWithCarLock('res-update-1', {
          start_date: new Date('2026-07-03'),
        }),
      ).rejects.toThrow('USER_OVERLAP');
      expect(mockTxReservation.update).not.toHaveBeenCalled();
    });

    it('should throw CAR_OVERLAP when update causes car schedule conflict', async () => {
      mockTxReservation.findUnique.mockResolvedValue(existing);
      mockTx.$executeRaw.mockResolvedValue(1);
      mockTxReservation.count
        .mockResolvedValueOnce(0) // user overlap count
        .mockResolvedValueOnce(1); // car overlap count > 0

      await expect(
        repository.updateWithCarLock('res-update-1', {
          carId: 'car-busy',
        }),
      ).rejects.toThrow('CAR_OVERLAP');
      expect(mockTxReservation.update).not.toHaveBeenCalled();
    });
  });
});
