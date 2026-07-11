import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaReservationsRepository } from './repositories/prisma-reservations.repository';
import { UsersModule } from '../users/users.module';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [PrismaModule, UsersModule, CarsModule],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    {
      provide: 'IReservationsRepository',
      useClass: PrismaReservationsRepository,
    },
  ],
})
export class ReservationsModule {}
