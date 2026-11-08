import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CarsModule } from './cars/cars.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';
import { EventEmitter } from 'events';
import type { KeyvStoreAdapter } from 'keyv';
import type { RedisClientType } from 'redis';

class RedisKeyvAdapter extends EventEmitter implements KeyvStoreAdapter {
  readonly opts = {};
  private readonly store: RedisStore<RedisClientType>;

  constructor(store: RedisStore<RedisClientType>) {
    super();
    this.store = store;

    const redisEvents = ['error', 'connect', 'ready', 'reconnecting', 'end'];
    for (const event of redisEvents) {
      this.store.client.on(event, (...args: unknown[]) => {
        this.emit(event, ...args);
      });
    }
  }

  async get<Value>(key: string): Promise<Value | undefined> {
    return this.store.get<Value>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<unknown> {
    return this.store.set(key, value, ttl);
  }

  async delete(key: string): Promise<boolean> {
    const deletedCount = await this.store.client.del(key);
    return deletedCount > 0;
  }

  async clear(): Promise<void> {
    await this.store.reset();
  }

  async disconnect(): Promise<void> {
    if (this.store.client.isOpen) {
      await this.store.client.quit();
    }
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 10,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
        });

        return {
          stores: [new RedisKeyvAdapter(store)],
        };
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CarsModule,
    ReservationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
