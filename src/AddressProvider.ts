import { Address } from 'viem'
import { Clients } from './DopplerSDK'

export interface DopplerAddresses {
  airlock: Address
  tokenFactory: Address
  dopplerFactory: Address
  governanceFactory: Address
  migrator: Address
  poolManager: Address
}

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // sepolia placeholder
  11155111: {
    airlock: '0x...' as Address,
    tokenFactory: '0x...' as Address,
    dopplerFactory: '0x...' as Address,
    governanceFactory: '0x...' as Address,
    migrator: '0x...' as Address,
    poolManager: '0x...' as Address
  },
}

export class AddressProvider {
  private readonly chainId: number
  private readonly addresses: DopplerAddresses

  constructor(chainId: number, addresses?: Partial<DopplerAddresses>) {
    this.chainId = chainId
    
    const defaultAddresses = DOPPLER_ADDRESSES[chainId]
    if (!defaultAddresses && !addresses) {
      throw new Error(`No default addresses found for chain ${chainId}`)
    }

    this.addresses = {
      ...defaultAddresses,
      ...addresses
    }
  }

  public getAddresses(): DopplerAddresses {
    return this.addresses
  }

  public getChainId(): number {
    return this.chainId
  }
}
