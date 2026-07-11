import { Test, TestingModule } from '@nestjs/testing';
import { CarsService } from './cars.service';
import { NotFoundException } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';

describe('CarsService', () => {
  let service: CarsService;

  const mockCarsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateAccessories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: 'ICarsRepository',
          useValue: mockCarsRepository,
        },
      ],
    }).compile();

    service = module.get<CarsService>(CarsService);
    jest.clearAllMocks();
  });

  const validCreateDto: CreateCarDto = {
    model: 'Test Model',
    color: 'Red',
    year: 2020,
    value_per_day: 100,
    number_of_passengers: 5,
    accessories: [{ description: 'AC' }],
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a car successfully', async () => {
      const expectedCar = { id: '1', ...validCreateDto };
      mockCarsRepository.create.mockResolvedValue(expectedCar);

      const result = await service.create(validCreateDto);

      expect(result).toEqual(expectedCar);
      expect(mockCarsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'Test Model',
          accessories: [{ description: 'AC' }],
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated cars', async () => {
      const expectedResult = {
        cars: [{ id: '1' }],
        total: 1,
        limit: 10,
        offset: 0,
      };
      mockCarsRepository.findAll.mockResolvedValue(expectedResult);

      const query = { limit: 10, offset: 0 };
      const result = await service.findAll(query);

      expect(result).toEqual(expectedResult);
      expect(mockCarsRepository.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a car if found', async () => {
      mockCarsRepository.findById.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1');
      expect(result).toEqual({ id: '1' });
    });

    it('should throw NotFoundException if car is not found', async () => {
      mockCarsRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a car if found', async () => {
      mockCarsRepository.findById.mockResolvedValue({ id: '1' });
      mockCarsRepository.update.mockResolvedValue({ id: '1', model: 'Updated' });

      const result = await service.update('1', { model: 'Updated' });
      expect(result).toEqual({ id: '1', model: 'Updated' });
      expect(mockCarsRepository.update).toHaveBeenCalledWith('1', { model: 'Updated' });
    });

    it('should throw NotFoundException if car to update does not exist', async () => {
      mockCarsRepository.findById.mockResolvedValue(null);
      await expect(service.update('1', { model: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a car if found', async () => {
      mockCarsRepository.findById.mockResolvedValue({ id: '1' });
      mockCarsRepository.delete.mockResolvedValue(undefined);

      await service.remove('1');
      expect(mockCarsRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if car to remove does not exist', async () => {
      mockCarsRepository.findById.mockResolvedValue(null);
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccessory', () => {
    it('should update accessory if car found', async () => {
      mockCarsRepository.findById.mockResolvedValue({ id: '1' });
      mockCarsRepository.updateAccessories.mockResolvedValue({ id: '1' });

      const result = await service.updateAccessory('1', { description: 'GPS' });
      expect(result).toEqual({ id: '1' });
      expect(mockCarsRepository.updateAccessories).toHaveBeenCalledWith('1', 'GPS');
    });

    it('should throw NotFoundException if car not found when updating accessory', async () => {
      mockCarsRepository.findById.mockResolvedValue(null);
      await expect(service.updateAccessory('1', { description: 'GPS' })).rejects.toThrow(NotFoundException);
    });
  });
});
