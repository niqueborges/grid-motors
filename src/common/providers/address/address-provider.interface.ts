export interface AddressData {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface IAddressProvider {
  getAddressByCep(cep: string): Promise<AddressData | null>;
}
