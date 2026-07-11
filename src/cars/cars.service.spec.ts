import { Test, TestingModule } from '@nestjs/testing';
import { CarsService } from './cars.service';
import { NotFoundException } from '@nestjs/common';
import { CarEntity } from './entities/car.entity';

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a car if found', async () => {
      const car: CarEntity = {
        id: '1',
        model: 'Test',
        color: 'Red',
        year: 2020,
        value_per_day: 100,
        number_of_passengers: 4,
        accessories: [],
      };
      mockCarsRepository.findById.mockResolvedValue(car);

      const result = await service.findOne('1');
      expect(result).toEqual(car);
    });

    it('should throw NotFoundException if car is not found', async () => {
      mockCarsRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call repository create with mapped entity', async () => {
      const dto = {
        model: 'Test',
        color: 'Red',
        year: 2020,
        value_per_day: 100,
        number_of_passengers: 4,
        accessories: [{ description: 'Air' }],
      };
      const expectedEntity = { ...dto };
      mockCarsRepository.create.mockResolvedValue({
        id: '1',
        ...expectedEntity,
      });

      const result = await service.create(dto);
      expect(mockCarsRepository.create).toHaveBeenCalledWith(expectedEntity);
      expect(result.id).toBe('1');
    });
  });

  describe('updateAccessory', () => {
    it('should call updateAccessories on the repository', async () => {
      mockCarsRepository.findById.mockResolvedValue({ id: '1' });
      mockCarsRepository.updateAccessories.mockResolvedValue({
        id: '1',
        accessories: [{ description: 'Air' }],
      });

      const result = await service.updateAccessory('1', { description: 'Air' });
      expect(mockCarsRepository.updateAccessories).toHaveBeenCalledWith(
        '1',
        'Air',
      );
      expect(result.accessories).toHaveLength(1);
    });
  });
});
