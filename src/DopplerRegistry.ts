import { Address, PublicClient } from 'viem'
import { DopplerPool } from './entities'
import { Token } from '@uniswap/sdk-core'
import { PoolDeployer } from './PoolDeployer'
import { DeploymentConfig } from './types'

export interface DopplerDeployment {
  pool: Address
  assetToken: Token
  quoteToken: Token
  hook: Address
  governance: Address
  deployedAt: number
  deploymentTx: Address
}

export class DopplerRegistry {
  private static STORAGE_KEY = 'deployed-dopplers'
  
  private readonly chainId: number

  constructor(chainId: number) {
    this.chainId = chainId
  }

  public async addDoppler(deployment: DopplerDeployment) {
    const stored = this.getStoredDopplers()
    stored[this.chainId] = stored[this.chainId] || {}
    stored[this.chainId][deployment.pool] = deployment
    this.storeDopplers(stored)
  }

  public getDoppler(poolAddress: Address): DopplerDeployment | undefined {
    const stored = this.getStoredDopplers()
    return stored[this.chainId]?.[poolAddress]
  }

  public getAllDopplers(): DopplerDeployment[] {
    const stored = this.getStoredDopplers()
    return Object.values(stored[this.chainId] || {})
  }

  private getStoredDopplers(): { [chainId: number]: { [poolAddress: string]: DopplerDeployment } } {
    if (typeof localStorage === 'undefined') return {}
    
    const stored = localStorage.getItem(DopplerRegistry.STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  private storeDopplers(dopplers: { [chainId: number]: { [poolAddress: string]: DopplerDeployment } }) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DopplerRegistry.STORAGE_KEY, JSON.stringify(dopplers))
    }
  }
}

// Update PoolDeployer to use registry
export class DopplerDeployer {
  private readonly client: PublicClient
  private readonly deployer: PoolDeployer
  private readonly registry: DopplerRegistry
  
  constructor(client: PublicClient, deployer: PoolDeployer) {
    this.client = client
    this.deployer = deployer
    this.registry = new DopplerRegistry(client.chain?.id ?? 1)
  }

  async deploy(config: DeploymentConfig): Promise<DopplerPool> {
    const deployed = await this.deployer.deploy(config)
    
    // Save deployment info
    await this.registry.addDoppler({
      pool: deployed.doppler.address,
      assetToken: deployed.doppler.assetToken,
      quoteToken: deployed.doppler.quoteToken,
      hook: deployed.doppler.hook,
      governance: deployed.doppler.governance,
      deployedAt: Date.now(),
      deploymentTx: deployed.doppler.deploymentTx
    })

    return new DopplerPool(deployed.doppler, this.client)
  }

  getDeployedPools(): DopplerDeployment[] {
    return this.registry.getAllDopplers()
  }
}