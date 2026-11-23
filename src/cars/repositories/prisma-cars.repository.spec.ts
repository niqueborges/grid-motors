import { Test, TestingModule } from '@nestjs/testing';
import { PrismaCarsRepository } from './prisma-cars.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CarEntity } from '../entities/car.entity';

describe('PrismaCarsRepository', () => {
  let repository: PrismaCarsRepository;

  const mockPrismaCar = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPrismaAccessory = {
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockPrismaService = {
    car: mockPrismaCar,
    accessory: mockPrismaAccessory,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaCarsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaCarsRepository>(PrismaCarsRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a car with nested accessories and include accessories in result', async () => {
      const carEntity: CarEntity = {
        model: 'Civic',
        color: 'Black',
        year: 2022,
        value_per_day: 150,
        number_of_passengers: 5,
        accessories: [
          { description: 'Air conditioning' },
          { description: 'GPS' },
        ],
      };

      const createdCar = {
        id: 'car-uuid-1',
        ...carEntity,
        accessories: [
          { id: 'acc-1', description: 'Air conditioning', carId: 'car-uuid-1' },
          { id: 'acc-2', description: 'GPS', carId: 'car-uuid-1' },
        ],
      };

      mockPrismaCar.create.mockResolvedValue(createdCar);

      const result = await repository.create(carEntity);

      expect(mockPrismaCar.create).toHaveBeenCalledWith({
        data: {
          model: 'Civic',
          color: 'Black',
          year: 2022,
          value_per_day: 150,
          number_of_passengers: 5,
          accessories: {
            create: [
              { description: 'Air conditioning' },
              { description: 'GPS' },
            ],
          },
        },
        include: { accessories: true },
      });
      expect(result).toEqual(createdCar);
    });
  });

  describe('findAll', () => {
    it('should apply default pagination and empty filters when none provided', async () => {
      const mockCars = [
        {
          id: 'c1',
          model: 'Corolla',
          color: 'White',
          year: 2021,
          accessories: [],
        },
      ];
      mockPrismaCar.findMany.mockResolvedValue(mockCars);
      mockPrismaCar.count.mockResolvedValue(1);

      const result = await repository.findAll({});

      expect(mockPrismaCar.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: { accessories: true },
      });
      expect(mockPrismaCar.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        cars: mockCars,
        total: 1,
        limit: 10,
        offset: 0,
        offsets: 1,
      });
    });

    it('should apply all filters with insensitive contains for strings and exact match for numbers', async () => {
      mockPrismaCar.findMany.mockResolvedValue([]);
      mockPrismaCar.count.mockResolvedValue(0);

      const query = {
        model: 'Sedan',
        color: 'Red',
        year: 2020,
        value_per_day: 120,
        number_of_passengers: 4,
        limit: 5,
        offset: 10,
      };

      const result = await repository.findAll(query);

      const expectedWhere = {
        model: { contains: 'Sedan', mode: 'insensitive' },
        color: { contains: 'Red', mode: 'insensitive' },
        year: 2020,
        value_per_day: 120,
        number_of_passengers: 4,
      };

      expect(mockPrismaCar.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 10,
        take: 5,
        include: { accessories: true },
      });
      expect(mockPrismaCar.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result.offsets).toBe(0);
    });

    it('should compute offsets correctly when total is not an exact multiple of limit', async () => {
      mockPrismaCar.findMany.mockResolvedValue([]);
      mockPrismaCar.count.mockResolvedValue(23);

      const result = await repository.findAll({ limit: 5, offset: 0 });

      expect(result.offsets).toBe(5); // Math.ceil(23 / 5) = 5
      expect(result.total).toBe(23);
    });
  });

  describe('findById', () => {
    it('should query prisma.car.findUnique with id and include accessories', async () => {
      const mockCar = { id: 'car-1', model: 'Golf', accessories: [] };
      mockPrismaCar.findUnique.mockResolvedValue(mockCar);

      const result = await repository.findById('car-1');

      expect(mockPrismaCar.findUnique).toHaveBeenCalledWith({
        where: { id: 'car-1' },
        include: { accessories: true },
      });
      expect(result).toEqual(mockCar);
    });

    it('should return null when car is not found', async () => {
      mockPrismaCar.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should strip accessories from update payload and update scalar fields', async () => {
      const updateData = {
        color: 'Blue',
        value_per_day: 200,
        accessories: [{ description: 'Ignored accessory' }],
      };

      const updatedCar = {
        id: 'car-1',
        model: 'Golf',
        color: 'Blue',
        value_per_day: 200,
        accessories: [],
      };
      mockPrismaCar.update.mockResolvedValue(updatedCar);

      const result = await repository.update('car-1', updateData);

      expect(mockPrismaCar.update).toHaveBeenCalledWith({
        where: { id: 'car-1' },
        data: {
          color: 'Blue',
          value_per_day: 200,
        },
        include: { accessories: true },
      });
      expect(result).toEqual(updatedCar);
    });
  });

  describe('delete', () => {
    it('should call prisma.car.delete with where id', async () => {
      mockPrismaCar.delete.mockResolvedValue({ id: 'car-1' });

      await repository.delete('car-1');

      expect(mockPrismaCar.delete).toHaveBeenCalledWith({
        where: { id: 'car-1' },
      });
    });
  });

  describe('updateAccessories', () => {
    it('should throw Error when car does not exist', async () => {
      mockPrismaCar.findUnique.mockResolvedValue(null);

      await expect(
        repository.updateAccessories('invalid-id', 'Sunroof'),
      ).rejects.toThrow('Car not found');
      expect(mockPrismaAccessory.delete).not.toHaveBeenCalled();
      expect(mockPrismaAccessory.create).not.toHaveBeenCalled();
    });

    it('should remove existing accessory when found case-insensitively', async () => {
      const existingCar = {
        id: 'car-1',
        accessories: [
          { id: 'acc-1', description: 'Leather seats' },
          { id: 'acc-2', description: 'GPS' },
        ],
      };
      const refreshedCar = {
        id: 'car-1',
        accessories: [{ id: 'acc-2', description: 'GPS' }],
      };

      mockPrismaCar.findUnique
        .mockResolvedValueOnce(existingCar)
        .mockResolvedValueOnce(refreshedCar);
      mockPrismaAccessory.delete.mockResolvedValue({ id: 'acc-1' });

      const result = await repository.updateAccessories(
        'car-1',
        'LEATHER SEATS',
      );

      expect(mockPrismaAccessory.delete).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
      });
      expect(mockPrismaAccessory.create).not.toHaveBeenCalled();
      expect(result).toEqual(refreshedCar);
    });

    it('should create new accessory when not currently present on car', async () => {
      const existingCar = {
        id: 'car-1',
        accessories: [{ id: 'acc-1', description: 'GPS' }],
      };
      const refreshedCar = {
        id: 'car-1',
        accessories: [
          { id: 'acc-1', description: 'GPS' },
          { id: 'acc-new', description: 'Sunroof' },
        ],
      };

      mockPrismaCar.findUnique
        .mockResolvedValueOnce(existingCar)
        .mockResolvedValueOnce(refreshedCar);
      mockPrismaAccessory.create.mockResolvedValue({ id: 'acc-new' });

      const result = await repository.updateAccessories('car-1', 'Sunroof');

      expect(mockPrismaAccessory.create).toHaveBeenCalledWith({
        data: {
          description: 'Sunroof',
          carId: 'car-1',
        },
      });
      expect(mockPrismaAccessory.delete).not.toHaveBeenCalled();
      expect(result).toEqual(refreshedCar);
    });
  });
});
