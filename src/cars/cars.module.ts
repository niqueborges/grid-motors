import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaCarsRepository } from './repositories/prisma-cars.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CarsController],
  providers: [
    CarsService,
    {
      provide: 'ICarsRepository',
      useClass: PrismaCarsRepository,
    },
  ],
})
export class CarsModule {}
