import { Address } from 'viem';

export type DopplerV3Addresses = {
  airlock: Address;
  tokenFactory: Address;
  governanceFactory: Address;
  liquidityMigrator: Address;
  v3Initializer: Address;
  universalRouter: Address;
  basicRouter: Address;
  permit2: Address;
};

export type PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};
