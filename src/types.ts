import { Address, Hash, PublicClient, TestClient, WalletClient } from 'viem';
import { Token } from '@uniswap/sdk-core';

export interface Clients {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  testClient?: TestClient;
}

export interface DopplerAddresses {
  airlock: Address;
  tokenFactory: Address;
  dopplerFactory: Address;
  governanceFactory: Address;
  migrator: Address;
  poolManager: Address;
  stateView: Address;
  customRouter: Address;
}

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
}

export interface DeploymentConfigParams {
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
