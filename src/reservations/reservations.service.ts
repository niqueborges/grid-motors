import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FindReservationsQueryDto } from './dto/find-reservations.query.dto';
import type { IReservationsRepository } from './repositories/reservations.repository.interface';
import type { IUsersRepository } from '../users/repositories/users.repository';
import type { ICarsRepository } from '../cars/repositories/cars.repository.interface';
import { ReservationEntity } from './entities/reservation.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @Inject('IReservationsRepository')
    private readonly reservationsRepository: IReservationsRepository,
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    @Inject('ICarsRepository')
    private readonly carsRepository: ICarsRepository,
  ) {}

  private async calculateFinalValueAndCheckOverlap(
    userId: string,
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ) {
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.qualified !== 'yes') {
      throw new BadRequestException('User is not qualified to make a reservation');
    }

    const car = await this.carsRepository.findById(carId);
    if (!car) throw new NotFoundException('Car not found');

    const overlap = await this.reservationsRepository.findOverlappingReservations(
      userId,
      carId,
      startDate,
      endDate,
      excludeReservationId,
    );

    if (overlap.hasUserOverlap) {
      throw new BadRequestException('User already has a reservation in this period');
    }
    if (overlap.hasCarOverlap) {
      throw new BadRequestException('Car is already reserved in this period');
    }

    // calculate diff in days (inclusive)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // If start and end are the same day, it's 1 day of rent.
    const days = diffDays + 1;
    const finalValue = days * car.value_per_day;

    return finalValue;
  }

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationEntity> {
    const final_value = await this.calculateFinalValueAndCheckOverlap(
      userId,
      createReservationDto.id_car,
      createReservationDto.start_date,
      createReservationDto.end_date,
    );

    const entity: ReservationEntity = {
      start_date: createReservationDto.start_date,
      end_date: createReservationDto.end_date,
      carId: createReservationDto.id_car,
      userId,
      final_value,
    };

    return this.reservationsRepository.create(entity);
  }

  findAll(query: FindReservationsQueryDto) {
    return this.reservationsRepository.findAll(query);
  }

  async findOne(id: string): Promise<ReservationEntity> {
    const reservation = await this.reservationsRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<ReservationEntity> {
    const existing = await this.findOne(id);

    const startDate = updateReservationDto.start_date || existing.start_date;
    const endDate = updateReservationDto.end_date || existing.end_date;
    const carId = updateReservationDto.id_car || existing.carId;

    let final_value = existing.final_value;

    if (updateReservationDto.start_date || updateReservationDto.end_date || updateReservationDto.id_car) {
      final_value = await this.calculateFinalValueAndCheckOverlap(
        existing.userId,
        carId,
        startDate,
        endDate,
        id,
      );
    }

    return this.reservationsRepository.update(id, {
      start_date: startDate,
      end_date: endDate,
      carId,
      final_value,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.reservationsRepository.delete(id);
  }
}
