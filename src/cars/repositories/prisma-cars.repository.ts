import { Injectable } from '@nestjs/common';
import { ICarsRepository, PaginatedCarsResult } from './cars.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CarEntity } from '../entities/car.entity';
import { FindCarsQueryDto } from '../dto/find-cars.query.dto';

@Injectable()
export class PrismaCarsRepository implements ICarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CarEntity): Promise<CarEntity> {
    return this.prisma.car.create({
      data: {
        model: data.model,
        color: data.color,
        year: data.year,
        value_per_day: data.value_per_day,
        number_of_passengers: data.number_of_passengers,
        accessories: {
          create: data.accessories.map((acc) => ({ description: acc.description })),
        },
      },
      include: { accessories: true },
    });
  }

  async findAll(query: FindCarsQueryDto): Promise<PaginatedCarsResult> {
    const { limit = 10, offset = 0, ...filters } = query;

    const where: any = {};
    if (filters.model) where.model = { contains: filters.model, mode: 'insensitive' };
    if (filters.color) where.color = { contains: filters.color, mode: 'insensitive' };
    if (filters.year) where.year = filters.year;
    if (filters.value_per_day) where.value_per_day = filters.value_per_day;
    if (filters.number_of_passengers) where.number_of_passengers = filters.number_of_passengers;

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip: offset,
        take: limit,
        include: { accessories: true },
      }),
      this.prisma.car.count({ where }),
    ]);

    const offsets = Math.ceil(total / limit);

    return {
      cars,
      total,
      limit,
      offset,
      offsets,
    };
  }

  async findById(id: string): Promise<CarEntity | null> {
    return this.prisma.car.findUnique({
      where: { id },
      include: { accessories: true },
    });
  }

  async update(id: string, data: Partial<CarEntity>): Promise<CarEntity> {
    // Note: accessories update here only handles scalar fields of car in this challenge usually, 
    // but if accessories are provided we would need to replace them. The challenge has a specific route for accessories.
    const { accessories, ...rest } = data;
    return this.prisma.car.update({
      where: { id },
      data: rest,
      include: { accessories: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.car.delete({
      where: { id },
    });
  }

  async updateAccessories(carId: string, description: string): Promise<CarEntity> {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { accessories: true },
    });

    if (!car) throw new Error('Car not found');

    const existingAccessory = car.accessories.find(
      (a) => a.description.toLowerCase() === description.toLowerCase(),
    );

    if (existingAccessory) {
      // Remove
      await this.prisma.accessory.delete({
        where: { id: existingAccessory.id },
      });
    } else {
      // Add
      await this.prisma.accessory.create({
        data: {
          description,
          carId,
        },
      });
    }

    // return updated car
    return this.findById(carId) as Promise<CarEntity>;
  }
}
