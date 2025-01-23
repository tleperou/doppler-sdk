import { Address } from 'viem';

export interface DopplerV3Addresses {
  airlock: Address;
  tokenFactory: Address;
  governanceFactory: Address;
  liquidityMigrator: Address;
  v3Initializer: Address;
  universalRouter: Address;
  basicRouter: Address;
}

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}
