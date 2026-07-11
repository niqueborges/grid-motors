import { Module } from '@nestjs/common';
import { ViaCepAddressProvider } from './address/viacep-address.provider';

@Module({
  providers: [
    {
      provide: 'IAddressProvider',
      useClass: ViaCepAddressProvider,
    },
  ],
  exports: ['IAddressProvider'],
})
export class ProvidersModule {}
