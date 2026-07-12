import axios from 'axios';
import { ViaCepAddressProvider } from './viacep-address.provider';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ViaCepAddressProvider', () => {
  let provider: ViaCepAddressProvider;

  beforeEach(() => {
    provider = new ViaCepAddressProvider();
    jest.clearAllMocks();
  });

  describe('getAddressByCep', () => {
    it('should return address data for a valid CEP', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          logradouro: 'Praça da Sé',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        },
      });

      const result = await provider.getAddressByCep('01001000');

      expect(result).toEqual({
        street: 'Praça da Sé',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01001000/json/',
      );
    });

    it('should return null when ViaCEP returns erro: true', async () => {
      mockedAxios.get.mockResolvedValue({ data: { erro: true } });

      const result = await provider.getAddressByCep('99999999');
      expect(result).toBeNull();
    });

    it('should return null when the request throws an error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await provider.getAddressByCep('00000000');
      expect(result).toBeNull();
    });
  });
});
