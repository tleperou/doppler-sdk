import { Address, Hash, Hex } from 'viem';
import { Token } from '@uniswap/sdk-core';
import { PoolKey } from '@uniswap/v4-sdk';

// TODO: Add governance data
export interface Doppler {
  address: Address;
  assetToken: Token;
  quoteToken: Token;
  hook: Address;
  poolKey: PoolKey;
  poolId: Hex;
  deployedAt: bigint;
  deploymentTx: Hex;
  immutables: DopplerImmutables;
}

export interface DopplerImmutables {
  startingTime: bigint;
  endingTime: bigint;
  epochLength: bigint;
  isToken0: boolean;
  numTokensToSell: bigint;
  minimumProceeds: bigint;
  maximumProceeds: bigint;
  startingTick: number;
  endingTick: number;
  gamma: number;
  totalEpochs: number;
  numPDSlugs: number;
}

export interface DopplerState {
  lastEpoch: number;
  tickAccumulator: bigint;
  totalTokensSold: bigint;
  totalProceeds: bigint;
  totalTokensSoldLastEpoch: bigint;
  feesAccrued: {
    amount0: bigint;
    amount1: bigint;
  };
  currentTick: number;
}

export interface PositionState {
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  salt: Hash;
  type: 'lowerSlug' | 'upperSlug' | 'pdSlug';
}

export interface DeploymentConfig {
  salt: Hash;
  dopplerAddress: Address;
  poolKey: PoolKey;
  token: TokenConfig;
  hook: HookConfig;
  pool: PoolConfig;
}

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
}

export interface HookConfig {
  assetToken: Token;
  quoteToken: Token;
  startTime: number; // in seconds
  endTime: number; // in seconds
  epochLength: number; // in seconds
  startTick: number;
  endTick: number;
  gamma: number;
  minProceeds: bigint;
  maxProceeds: bigint;
  numTokensToSell: bigint;
  numPdSlugs: number;
}

export interface PoolConfig {
  tickSpacing: number;
  fee: number; // In bips (e.g., 3000 for 0.3%)
}
