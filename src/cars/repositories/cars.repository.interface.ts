import { CarEntity } from '../entities/car.entity';
import { FindCarsQueryDto } from '../dto/find-cars.query.dto';

export interface PaginatedCarsResult {
  cars: CarEntity[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

export interface ICarsRepository {
  create(data: CarEntity): Promise<CarEntity>;
  findAll(query: FindCarsQueryDto): Promise<PaginatedCarsResult>;
  findById(id: string): Promise<CarEntity | null>;
  update(id: string, data: Partial<CarEntity>): Promise<CarEntity>;
  delete(id: string): Promise<void>;
  updateAccessories(carId: string, description: string): Promise<CarEntity>;
}
