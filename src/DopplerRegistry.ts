import { Address, PublicClient } from 'viem';
import { Doppler } from './types';
import { PoolDeployer } from './PoolDeployer';
import { DeploymentConfig } from './types';

export class DopplerRegistry {
  private static STORAGE_KEY = 'deployed-dopplers';

  private readonly chainId: number;

  constructor(chainId: number) {
    this.chainId = chainId;
  }

  public async addDoppler(deployment: Doppler) {
    const stored = this.getStoredDopplers();
    stored[this.chainId] = stored[this.chainId] || {};
    stored[this.chainId][deployment.address] = deployment;
    this.storeDopplers(stored);
  }

  public getDoppler(poolAddress: Address): Doppler | undefined {
    const stored = this.getStoredDopplers();
    return stored[this.chainId]?.[poolAddress];
  }

  public getAllDopplers(): Doppler[] {
    const stored = this.getStoredDopplers();
    return Object.values(stored[this.chainId] || {});
  }

  private getStoredDopplers(): {
    [chainId: number]: { [poolAddress: string]: Doppler };
  } {
    if (typeof localStorage === 'undefined') return {};

    const stored = localStorage.getItem(DopplerRegistry.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private storeDopplers(dopplers: {
    [chainId: number]: { [poolAddress: string]: Doppler };
  }) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        DopplerRegistry.STORAGE_KEY,
        JSON.stringify(dopplers)
      );
    }
  }
}

// Update PoolDeployer to use registry
export class DopplerDeployer {
  private readonly client: PublicClient;
  private readonly deployer: PoolDeployer;
  private readonly registry: DopplerRegistry;

  constructor(client: PublicClient, deployer: PoolDeployer) {
    this.client = client;
    this.deployer = deployer;
    this.registry = new DopplerRegistry(client.chain?.id ?? 1);
  }

  async deploy(config: DeploymentConfig): Promise<Doppler> {
    const { doppler, pool } = await this.deployer.deploy(config);

    // Save deployment info
    await this.registry.addDoppler(doppler);

    return doppler;
  }

  getDeployedPools(): Doppler[] {
    return this.registry.getAllDopplers();
  }
}
