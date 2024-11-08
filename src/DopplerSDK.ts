import { PublicClient, WalletClient } from 'viem';
import { PoolDeployer } from './PoolDeployer';
import { DopplerRegistry } from './DopplerRegistry';
import { GovernanceManager } from './GovernanceManager';
import { AddressProvider, DopplerAddresses } from './AddressProvider';
import { ContractManager } from './ContractManager';

export interface DopplerSDKConfig {
  addresses: DopplerAddresses;
}

export interface Clients {
  public: PublicClient;
  wallet?: WalletClient;
}

export class DopplerSDK {
  public readonly deployer: PoolDeployer;
  public readonly dopplers: DopplerRegistry;
  public readonly governance: GovernanceManager;
  public readonly addresses: AddressProvider;
  public readonly contracts: ContractManager;

  private readonly clients: Clients;

  constructor(clients: Clients, config: DopplerSDKConfig) {
    this.clients = clients;
    this.addresses = new AddressProvider(
      clients.public.chain?.id ?? 1,
      config.addresses
    );
    this.contracts = new ContractManager(clients, this.addresses);
    this.deployer = new PoolDeployer(clients, this.addresses);
    this.dopplers = new DopplerRegistry(clients.public.chain?.id ?? 1);
    this.governance = new GovernanceManager(clients.public);
  }
}
