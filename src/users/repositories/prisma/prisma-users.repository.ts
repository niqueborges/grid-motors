import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUsersRepository } from '../users.repository';
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

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
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
