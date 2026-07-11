export class ReservationEntity {
  id?: string;
  start_date: Date;
  end_date: Date;
  final_value: number;
  userId: string;
  carId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
