import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaUsersRepository } from './repositories/prisma/prisma-users.repository';
import { ProvidersModule } from '../common/providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'IUsersRepository',
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [UsersService, 'IUsersRepository'],
})
export class UsersModule {}
