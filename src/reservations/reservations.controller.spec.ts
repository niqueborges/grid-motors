import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ReservationsController', () => {
  let controller: ReservationsController;

  const mockReservationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReservationsController>(ReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a reservation with authenticated userId', async () => {
      const dto = {
        start_date: new Date(),
        end_date: new Date(),
        id_car: 'car-1',
      };
      mockReservationsService.create.mockResolvedValue({ id: 'res-1' });

      const result = await controller.create(dto, 'user-1');
      expect(result).toEqual({ id: 'res-1' });
      expect(mockReservationsService.create).toHaveBeenCalledWith(
        dto,
        'user-1',
      );
    });
  });

  describe('findAll', () => {
    it('should return all reservations without ownership restrictions (regression)', async () => {
      mockReservationsService.findAll.mockResolvedValue({
        reserves: [],
        total: 0,
      });
      const result = await controller.findAll({});
      expect(result).toEqual({ reserves: [], total: 0 });
      expect(mockReservationsService.findAll).toHaveBeenCalledWith({});
    });
  });

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  describe('findOne', () => {
    it('should forward valid UUID to service and return reservation without ownership check (regression)', async () => {
      mockReservationsService.findOne.mockResolvedValue({ id: validUuid });
      const result = await controller.findOne(validUuid);
      expect(result).toEqual({ id: validUuid });
      expect(mockReservationsService.findOne).toHaveBeenCalledWith(validUuid);
    });
  });

  describe('update', () => {
    it('should forward valid UUID, dto, and currentUserId to service and update reservation', async () => {
      const updateDto = { start_date: new Date() };
      mockReservationsService.update.mockResolvedValue({ id: validUuid });
      const result = await controller.update(validUuid, updateDto, 'user-1');
      expect(result).toEqual({ id: validUuid });
      expect(mockReservationsService.update).toHaveBeenCalledWith(
        validUuid,
        updateDto,
        'user-1',
      );
    });
  });

  describe('remove', () => {
    it('should forward valid UUID and currentUserId to service and remove reservation', async () => {
      mockReservationsService.remove.mockResolvedValue(undefined);
      await controller.remove(validUuid, 'user-1');
      expect(mockReservationsService.remove).toHaveBeenCalledWith(
        validUuid,
        'user-1',
      );
    });
  });
});
