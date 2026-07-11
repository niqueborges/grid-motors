import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IReservationsRepository,
  PaginatedReservationsResult,
} from './reservations.repository.interface';
import { ReservationEntity } from '../entities/reservation.entity';
import { FindReservationsQueryDto } from '../dto/find-reservations.query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaReservationsRepository implements IReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ReservationEntity): Promise<ReservationEntity> {
    return this.prisma.reservation.create({
      data: {
        start_date: data.start_date,
        end_date: data.end_date,
        final_value: data.final_value,
        userId: data.userId,
        carId: data.carId,
      },
    });
  }

  async findAll(
    query: FindReservationsQueryDto,
  ): Promise<PaginatedReservationsResult> {
    const { limit = 10, offset = 0, ...filters } = query;

    const where: Prisma.ReservationWhereInput = {};
    if (filters.id_user) where.userId = filters.id_user;
    if (filters.id_car) where.carId = filters.id_car;
    if (filters.start_date) where.start_date = { gte: filters.start_date };
    if (filters.end_date) where.end_date = { lte: filters.end_date };
    if (filters.final_value) where.final_value = filters.final_value;

    const [reserves, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: offset,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    const offsets = Math.ceil(total / limit);

    return {
      reserves,
      total,
      limit,
      offset,
      offsets,
    };
  }

  async findById(id: string): Promise<ReservationEntity | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Partial<ReservationEntity>,
  ): Promise<ReservationEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt, updatedAt, ...rest } = data;
    return this.prisma.reservation.update({
      where: { id },
      data: rest,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reservation.delete({
      where: { id },
    });
  }

  async findOverlappingReservations(
    userId: string,
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ): Promise<{ hasUserOverlap: boolean; hasCarOverlap: boolean }> {
    const baseWhere: Prisma.ReservationWhereInput = {
      start_date: { lte: endDate },
      end_date: { gte: startDate },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    };

    const [userOverlapCount, carOverlapCount] = await Promise.all([
      this.prisma.reservation.count({
        where: { ...baseWhere, userId },
      }),
      this.prisma.reservation.count({
        where: { ...baseWhere, carId },
      }),
    ]);

    return {
      hasUserOverlap: userOverlapCount > 0,
      hasCarOverlap: carOverlapCount > 0,
    };
  }
}
