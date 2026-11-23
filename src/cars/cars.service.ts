import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FindCarsQueryDto } from './dto/find-cars.query.dto';
import type { ICarsRepository } from './repositories/cars.repository.interface';
import { CarEntity } from './entities/car.entity';
import { UpdateAccessoryDto } from './dto/update-accessory.dto';

@Injectable()
export class CarsService {
  constructor(
    @Inject('ICarsRepository')
    private readonly carsRepository: ICarsRepository,
    @Optional()
    @Inject(CACHE_MANAGER)
    private readonly cacheManager?: Cache,
  ) {}

  private async invalidateCache(): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.clear();
    }
  }

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
    const car = await this.carsRepository.create(carEntity);
    await this.invalidateCache();
    return car;
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
    const updated = await this.carsRepository.update(id, updateCarDto);
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string): Promise<void> {
    // Check if exists
    await this.findOne(id);
    await this.carsRepository.delete(id);
    await this.invalidateCache();
  }

  async updateAccessory(
    carId: string,
    updateAccessoryDto: UpdateAccessoryDto,
  ): Promise<CarEntity> {
    // Check if exists
    await this.findOne(carId);
    const updated = await this.carsRepository.updateAccessories(
      carId,
      updateAccessoryDto.description,
    );
    await this.invalidateCache();
    return updated;
  }
}
