import { PublicClient, WalletClient, TestClient } from 'viem';
import { DopplerAddresses, DopplerAddressProvider } from './AddressProvider';

export interface Clients {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  testClient?: TestClient;
}

export class DopplerSDK {
  public readonly addresses: DopplerAddressProvider;
  public readonly clients: Clients;

  constructor(clients: Clients, chainId: number, addresses?: DopplerAddresses) {
    this.clients = clients;
    this.addresses = new DopplerAddressProvider(chainId, addresses);
  }
}
