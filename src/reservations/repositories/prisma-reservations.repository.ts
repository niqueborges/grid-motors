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

  async createWithCarLock(data: ReservationEntity): Promise<ReservationEntity> {
    return this.prisma.$transaction(async (tx) => {
      // Lock the car to prevent concurrent overlapping reservations
      await tx.$executeRaw`SELECT * FROM "cars" WHERE "id" = ${data.carId}::uuid FOR UPDATE`;
      
      const baseWhere: Prisma.ReservationWhereInput = {
        start_date: { lte: data.end_date },
        end_date: { gte: data.start_date },
      };

      const [userOverlapCount, carOverlapCount] = await Promise.all([
        tx.reservation.count({
          where: { ...baseWhere, userId: data.userId },
        }),
        tx.reservation.count({
          where: { ...baseWhere, carId: data.carId },
        }),
      ]);

      if (userOverlapCount > 0) throw new Error('USER_OVERLAP');
      if (carOverlapCount > 0) throw new Error('CAR_OVERLAP');

      return tx.reservation.create({
        data: {
          start_date: data.start_date,
          end_date: data.end_date,
          final_value: data.final_value,
          userId: data.userId,
          carId: data.carId,
        },
      });
    });
  }

  async updateWithCarLock(
    id: string,
    data: Partial<ReservationEntity>,
  ): Promise<ReservationEntity> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      const carId = data.carId || existing.carId;
      await tx.$executeRaw`SELECT * FROM "cars" WHERE "id" = ${carId}::uuid FOR UPDATE`;

      const startDate = data.start_date || existing.start_date;
      const endDate = data.end_date || existing.end_date;

      const baseWhere: Prisma.ReservationWhereInput = {
        start_date: { lte: endDate },
        end_date: { gte: startDate },
        id: { not: id },
      };

      const [userOverlapCount, carOverlapCount] = await Promise.all([
        tx.reservation.count({
          where: { ...baseWhere, userId: existing.userId },
        }),
        tx.reservation.count({
          where: { ...baseWhere, carId: carId },
        }),
      ]);

      if (userOverlapCount > 0) throw new Error('USER_OVERLAP');
      if (carOverlapCount > 0) throw new Error('CAR_OVERLAP');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = data as any;
      delete rest.createdAt;
      delete rest.updatedAt;

      return tx.reservation.update({
        where: { id },
        data: rest,
      });
    });
  }
}
