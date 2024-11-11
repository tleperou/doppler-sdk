import { getContract, Address } from 'viem';
import { DopplerABI } from './abis/DopplerABI';
import { AirlockABI } from './abis/AirlockABI';
import { DopplerAddressProvider } from './AddressProvider';
import { DopplerClients } from './DopplerSDK';

export class ContractManager {
  private readonly clients: DopplerClients;
  private readonly addresses: DopplerAddressProvider;

  constructor(clients: DopplerClients, addresses: DopplerAddressProvider) {
    this.clients = clients;
    this.addresses = addresses;
  }

  dopplerAt(address: Address) {
    return getContract({
      address,
      abi: DopplerABI,
      client: this.clients.public,
    });
  }

  airlock() {
    return getContract({
      address: this.addresses.getAddresses().airlock,
      abi: AirlockABI,
      client: this.clients,
    });
  }
}
