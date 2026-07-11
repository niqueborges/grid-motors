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
    it('should create a reservation', async () => {
      const dto = { start_date: new Date(), end_date: new Date(), id_car: 'car-1' };
      const req = { user: { id: 'user-1' } };
      mockReservationsService.create.mockResolvedValue({ id: 'res-1' });

      const result = await controller.create(dto, req);
      expect(result).toEqual({ id: 'res-1' });
      expect(mockReservationsService.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('findAll', () => {
    it('should return all reservations', async () => {
      mockReservationsService.findAll.mockResolvedValue({ reserves: [], total: 0 });
      const result = await controller.findAll({});
      expect(result).toEqual({ reserves: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should return a reservation', async () => {
      mockReservationsService.findOne.mockResolvedValue({ id: 'res-1' });
      const result = await controller.findOne('res-1');
      expect(result).toEqual({ id: 'res-1' });
    });
  });

  describe('update', () => {
    it('should update a reservation', async () => {
      mockReservationsService.update.mockResolvedValue({ id: 'res-1' });
      const result = await controller.update('res-1', { start_date: new Date() });
      expect(result).toEqual({ id: 'res-1' });
    });
  });

  describe('remove', () => {
    it('should remove a reservation', async () => {
      mockReservationsService.remove.mockResolvedValue(undefined);
      await controller.remove('res-1');
      expect(mockReservationsService.remove).toHaveBeenCalledWith('res-1');
    });
  });
});
