import { PublicClient, WalletClient, TestClient } from 'viem';
import { PoolDeployer } from './PoolDeployer';
import { DopplerRegistry } from './DopplerRegistry';
import { GovernanceManager } from './GovernanceManager';
import { DopplerAddressProvider, DopplerAddresses } from './AddressProvider';

export interface DopplerSDKConfig {
  addresses: DopplerAddresses;
}

export interface Clients {
  public: PublicClient;
  wallet?: WalletClient;
  test?: TestClient;
}

export class DopplerSDK {
  public readonly deployer: PoolDeployer;
  public readonly dopplers: DopplerRegistry;
  public readonly governance: GovernanceManager;
  public readonly addresses: DopplerAddressProvider;

  private readonly clients: Clients;

  constructor(clients: Clients, config: DopplerSDKConfig) {
    this.clients = clients;
    this.addresses = new DopplerAddressProvider(
      clients.public.chain?.id ?? 31337,
      config.addresses
    );
    this.deployer = new PoolDeployer(this.clients, this.addresses);
    this.dopplers = new DopplerRegistry(this.clients.public.chain?.id ?? 31337);
    this.governance = new GovernanceManager(this.clients);
  }
}
