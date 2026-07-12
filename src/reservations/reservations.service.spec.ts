import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';

const mockReservationsRepository = {
  createWithCarLock: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  updateWithCarLock: jest.fn(),
  delete: jest.fn(),
};

const mockUsersRepository = {
  findById: jest.fn(),
};

const mockCarsRepository = {
  findById: jest.fn(),
};

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: 'IReservationsRepository',
          useValue: mockReservationsRepository,
        },
        {
          provide: 'IUsersRepository',
          useValue: mockUsersRepository,
        },
        {
          provide: 'ICarsRepository',
          useValue: mockCarsRepository,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if user is not qualified', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'no' });
      await expect(
        service.create(
          {
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-01-02'),
            id_car: 'car-1',
          },
          'user-1',
        ),
      ).rejects.toThrow('User is not qualified to make a reservation');
    });

    it('should create a reservation successfully', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      const mockResult = { id: 'res-1', final_value: 200 };
      mockReservationsRepository.createWithCarLock.mockResolvedValue(
        mockResult,
      );

      const result = await service.create(
        {
          start_date: new Date('2023-01-01'),
          end_date: new Date('2023-01-02'),
          id_car: 'car-1',
        },
        'user-1',
      );

      expect(result).toEqual(mockResult);
      expect(mockReservationsRepository.createWithCarLock).toHaveBeenCalledWith(
        expect.objectContaining({
          final_value: 200, // 2 days * 100
        }),
      );
    });

    it('should throw BadRequestException when USER_OVERLAP is raised', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      mockReservationsRepository.createWithCarLock.mockRejectedValue(
        new Error('USER_OVERLAP'),
      );

      await expect(
        service.create(
          {
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-01-02'),
            id_car: 'car-1',
          },
          'user-1',
        ),
      ).rejects.toThrow('User already has a reservation in this period');
    });

    it('should throw BadRequestException when CAR_OVERLAP is raised', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      mockReservationsRepository.createWithCarLock.mockRejectedValue(
        new Error('CAR_OVERLAP'),
      );

      await expect(
        service.create(
          {
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-01-02'),
            id_car: 'car-1',
          },
          'user-1',
        ),
      ).rejects.toThrow('Car is already reserved in this period');
    });

    it('should throw BadRequestException when start_date is after end_date', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });

      await expect(
        service.create(
          {
            start_date: new Date('2023-01-10'),
            end_date: new Date('2023-01-01'),
            id_car: 'car-1',
          },
          'user-1',
        ),
      ).rejects.toThrow('Start date must be before or equal to end date');
    });

    it('should re-throw unknown errors from createWithCarLock', async () => {
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      const unknownError = new Error('Unexpected DB failure');
      mockReservationsRepository.createWithCarLock.mockRejectedValue(
        unknownError,
      );

      await expect(
        service.create(
          {
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-01-02'),
            id_car: 'car-1',
          },
          'user-1',
        ),
      ).rejects.toThrow('Unexpected DB failure');
    });
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      const mockResult = {
        reserves: [],
        total: 0,
        limit: 10,
        offset: 0,
        offsets: 0,
      };
      mockReservationsRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockReservationsRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        'Reservation with ID invalid not found',
      );
    });

    it('should return reservation', async () => {
      mockReservationsRepository.findById.mockResolvedValue({ id: 'res-1' });
      const result = await service.findOne('res-1');
      expect(result).toEqual({ id: 'res-1' });
    });
  });

  describe('update', () => {
    it('should update reservation', async () => {
      const existing = {
        id: 'res-1',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-02'),
        carId: 'car-1',
        userId: 'user-1',
        final_value: 200,
      };
      mockReservationsRepository.findById.mockResolvedValue(existing);
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      const updated = { ...existing, final_value: 300 };
      mockReservationsRepository.updateWithCarLock.mockResolvedValue(updated);

      const result = await service.update('res-1', {
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-03'),
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when update raises NOT_FOUND', async () => {
      const existing = {
        id: 'res-1',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-02'),
        carId: 'car-1',
        userId: 'user-1',
        final_value: 200,
      };
      mockReservationsRepository.findById.mockResolvedValue(existing);
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      mockReservationsRepository.updateWithCarLock.mockRejectedValue(
        new Error('NOT_FOUND'),
      );

      await expect(
        service.update('res-1', {
          start_date: new Date('2023-01-01'),
          end_date: new Date('2023-01-03'),
        }),
      ).rejects.toThrow('Reservation not found');
    });

    it('should throw BadRequestException when update raises USER_OVERLAP', async () => {
      const existing = {
        id: 'res-1',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-02'),
        carId: 'car-1',
        userId: 'user-1',
        final_value: 200,
      };
      mockReservationsRepository.findById.mockResolvedValue(existing);
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      mockReservationsRepository.updateWithCarLock.mockRejectedValue(
        new Error('USER_OVERLAP'),
      );

      await expect(
        service.update('res-1', {
          start_date: new Date('2023-01-01'),
          end_date: new Date('2023-01-03'),
        }),
      ).rejects.toThrow('User already has a reservation in this period');
    });

    it('should throw BadRequestException when update raises CAR_OVERLAP', async () => {
      const existing = {
        id: 'res-1',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-02'),
        carId: 'car-1',
        userId: 'user-1',
        final_value: 200,
      };
      mockReservationsRepository.findById.mockResolvedValue(existing);
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      mockReservationsRepository.updateWithCarLock.mockRejectedValue(
        new Error('CAR_OVERLAP'),
      );

      await expect(
        service.update('res-1', {
          start_date: new Date('2023-01-01'),
          end_date: new Date('2023-01-03'),
        }),
      ).rejects.toThrow('Car is already reserved in this period');
    });

    it('should re-throw unknown errors from updateWithCarLock', async () => {
      const existing = {
        id: 'res-1',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-01-02'),
        carId: 'car-1',
        userId: 'user-1',
        final_value: 200,
      };
      mockReservationsRepository.findById.mockResolvedValue(existing);
      mockUsersRepository.findById.mockResolvedValue({ qualified: 'yes' });
      mockCarsRepository.findById.mockResolvedValue({ value_per_day: 100 });
      const unknownError = new Error('Unexpected DB failure on update');
      mockReservationsRepository.updateWithCarLock.mockRejectedValue(
        unknownError,
      );

      await expect(
        service.update('res-1', {
          start_date: new Date('2023-01-01'),
          end_date: new Date('2023-01-03'),
        }),
      ).rejects.toThrow('Unexpected DB failure on update');
    });
  });

  describe('remove', () => {
    it('should remove reservation', async () => {
      mockReservationsRepository.findById.mockResolvedValue({ id: 'res-1' });
      mockReservationsRepository.delete.mockResolvedValue(undefined);
      await service.remove('res-1');
      expect(mockReservationsRepository.delete).toHaveBeenCalledWith('res-1');
    });
  });
});
