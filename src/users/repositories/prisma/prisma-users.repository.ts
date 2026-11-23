import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUsersRepository, UsersQueryResult } from '../users.repository';
import { UserEntity } from '../../entities/user.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: data as Prisma.UserUncheckedCreateInput,
    });
    return new UserEntity(user);
  }

  async findAllPaginated(params: {
    limit: number;
    offset: number;
  }): Promise<UsersQueryResult> {
    const { limit = 10, offset = 0 } = params;

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [
      { name: 'asc' },
      { id: 'asc' },
    ];

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy,
        select: { id: true, name: true, qualified: true },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return new UserEntity(user);
  }

  async findByEmailOrCpf(
    email?: string,
    cpf?: string,
  ): Promise<UserEntity | null> {
    if (!email && !cpf) return null;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(cpf ? [{ cpf }] : [])],
      },
    });
    if (!user) return null;
    return new UserEntity(user);
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new UserEntity(user);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: data,
    });
    return new UserEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
