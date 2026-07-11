export class AccessoryEntity {
  id?: string;
  description: string;
  carId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CarEntity {
  id?: string;
  model: string;
  color: string;
  year: number;
  value_per_day: number;
  number_of_passengers: number;
  accessories: AccessoryEntity[];
  createdAt?: Date;
  updatedAt?: Date;
}
