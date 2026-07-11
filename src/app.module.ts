import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CarsModule } from './cars/cars.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    CarsModule,
    ReservationsModule,
  ],
})
export class AppModule {}
