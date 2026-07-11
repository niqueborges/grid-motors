import { ReservationEntity } from '../entities/reservation.entity';
import { FindReservationsQueryDto } from '../dto/find-reservations.query.dto';

export interface PaginatedReservationsResult {
  reserves: ReservationEntity[];
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

export interface IReservationsRepository {
  create(data: ReservationEntity): Promise<ReservationEntity>;
  findAll(
    query: FindReservationsQueryDto,
  ): Promise<PaginatedReservationsResult>;
  findById(id: string): Promise<ReservationEntity | null>;
  update(
    id: string,
    data: Partial<ReservationEntity>,
  ): Promise<ReservationEntity>;
  delete(id: string): Promise<void>;
  createWithCarLock(data: ReservationEntity): Promise<ReservationEntity>;
  updateWithCarLock(
    id: string,
    data: Partial<ReservationEntity>,
  ): Promise<ReservationEntity>;
}
