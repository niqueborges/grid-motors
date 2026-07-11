import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FindCarsQueryDto } from './dto/find-cars.query.dto';
import { ICarsRepository } from './repositories/cars.repository.interface';
import { CarEntity } from './entities/car.entity';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';

@Injectable()
export class CarsService {
  constructor(
    @Inject('ICarsRepository')
    private readonly carsRepository: ICarsRepository,
  ) {}

  async create(createCarDto: CreateCarDto): Promise<CarEntity> {
    const carEntity: CarEntity = {
      model: createCarDto.model,
      color: createCarDto.color,
      year: createCarDto.year,
      value_per_day: createCarDto.value_per_day,
      number_of_passengers: createCarDto.number_of_passengers,
      accessories: createCarDto.accessories.map((a) => ({
        description: a.description,
      })),
    };
    return this.carsRepository.create(carEntity);
  }

  async findAll(query: FindCarsQueryDto) {
    return this.carsRepository.findAll(query);
  }

  async findOne(id: string): Promise<CarEntity> {
    const car = await this.carsRepository.findById(id);
    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return car;
  }

  async update(id: string, updateCarDto: UpdateCarDto): Promise<CarEntity> {
    // Check if exists
    await this.findOne(id);
    return this.carsRepository.update(id, updateCarDto);
  }

  async remove(id: string): Promise<void> {
    // Check if exists
    await this.findOne(id);
    return this.carsRepository.delete(id);
  }

  async updateAccessory(
    carId: string,
    updateAccessoryDto: UpdateAccessoryDto,
  ): Promise<CarEntity> {
    // Check if exists
    await this.findOne(carId);
    return this.carsRepository.updateAccessories(
      carId,
      updateAccessoryDto.description,
    );
  }
}
