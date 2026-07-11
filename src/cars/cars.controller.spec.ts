import { Test, TestingModule } from '@nestjs/testing';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FindCarsQueryDto } from './dto/find-cars.query.dto';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';

describe('CarsController', () => {
  let controller: CarsController;

  const mockCarsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateAccessory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarsController],
      providers: [
        {
          provide: CarsService,
          useValue: mockCarsService,
        },
      ],
    }).compile();

    controller = module.get<CarsController>(CarsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call carsService.create and return result', async () => {
      const dto: CreateCarDto = {
        model: 'Test',
        color: 'Red',
        year: 2020,
        value_per_day: 100,
        number_of_passengers: 4,
        accessories: [],
      };
      const result = { id: '1', ...dto };
      mockCarsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toEqual(result);
      expect(mockCarsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call carsService.findAll and return result', async () => {
      const query: FindCarsQueryDto = { limit: 10, offset: 0 };
      const result = { cars: [], total: 0, limit: 10, offset: 0 };
      mockCarsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(query)).toEqual(result);
      expect(mockCarsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call carsService.findOne and return result', async () => {
      const result = { id: '1' };
      mockCarsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toEqual(result);
      expect(mockCarsService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should call carsService.update and return result', async () => {
      const dto: UpdateCarDto = { model: 'Updated' };
      const result = { id: '1', model: 'Updated' };
      mockCarsService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto)).toEqual(result);
      expect(mockCarsService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call carsService.remove', async () => {
      mockCarsService.remove.mockResolvedValue(undefined);

      expect(await controller.remove('1')).toBeUndefined();
      expect(mockCarsService.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('updateAccessory', () => {
    it('should call carsService.updateAccessory and return result', async () => {
      const dto: UpdateAccessoryDto = { description: 'New Acc' };
      const result = { id: '1' };
      mockCarsService.updateAccessory.mockResolvedValue(result);

      expect(await controller.updateAccessory('1', dto)).toEqual(result);
      expect(mockCarsService.updateAccessory).toHaveBeenCalledWith('1', dto);
    });
  });
});
