import { Module } from '@nestjs/common';
import { ViaCepAddressProvider } from './address/viacep-address.provider';
import { BcryptHashProvider } from './hash/bcrypt-hash.provider';

@Module({
  providers: [
    {
      provide: 'IAddressProvider',
      useClass: ViaCepAddressProvider,
    },
    {
      provide: 'IHashProvider',
      useClass: BcryptHashProvider,
    },
  ],
  exports: ['IAddressProvider', 'IHashProvider'],
})
export class ProvidersModule {}
