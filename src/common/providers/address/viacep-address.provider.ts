import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IAddressProvider, AddressData } from './address-provider.interface';

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Injectable()
export class ViaCepAddressProvider implements IAddressProvider {
  async getAddressByCep(cep: string): Promise<AddressData | null> {
    try {
      const response = await axios.get<ViaCepResponse>(
        `https://viacep.com.br/ws/${cep}/json/`,
      );
      
      if (response.data.erro) {
        return null;
      }
      
      return {
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
      };
    } catch {
      return null;
    }
  }
}
