import { createDoppler } from '@/actions/create/create';
import { buildConfig } from '@/actions/create/utils/configBuilder';
import { DOPPLER_ADDRESSES } from '@/addresses';
import { PoolKey } from '@uniswap/v4-sdk';
import { Address, Hash, PublicClient } from 'viem';
import { WalletClient } from 'viem/_types/clients/createWalletClient';
import {
  DeploymentConfigParams,
  DopplerAddresses,
  TokenConfig,
} from '../types';
import { Doppler } from './Doppler';

export const MAX_TICK_SPACING = 30;
export const DEFAULT_PD_SLUGS = 5;
export const DAY_SECONDS = 24 * 60 * 60;

// this maps onto the tick range, startingTick -> endingTick
export interface PriceRange {
  startPrice: number;
  endPrice: number;
}

export interface DopplerPreDeploymentConfig {
  // Token details
  name: string;
  symbol: string;
  totalSupply: bigint;
  numTokensToSell: bigint;

  // Time parameters
  blockTimestamp: number;
  startTimeOffset: number; // in days from now
  duration: number; // in days
  epochLength: number; // in seconds

  // Price parameters
  priceRange: PriceRange;
  tickSpacing: number;
  fee: number; // In bips

  // Sale parameters
  minProceeds: bigint;
  maxProceeds: bigint;
  numPdSlugs?: number; // uses a default if not set
}

export interface PoolConfig {
  tickSpacing: number;
  fee: number; // In bips (e.g., 3000 for 0.3%)
}

export interface DopplerDeploymentConfig {
  salt: Hash;
  dopplerAddress: Address;
  poolKey: PoolKey;
  token: TokenConfig;
  hook: DeploymentConfigParams;
  pool: PoolConfig;
}

export interface DeployerParams {
  publicClient: PublicClient;
  walletClient: WalletClient;
  addresses?: DopplerAddresses;
}

export class Deployer {
  public readonly walletClient: WalletClient;
  public readonly publicClient: PublicClient;
  public readonly chainId: number;
  public readonly addresses: DopplerAddresses;
  constructor({ publicClient, walletClient, addresses }: DeployerParams) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;

    if (!walletClient.chain) {
      throw new Error('Wallet client must be connected to a chain');
    }

    if (walletClient.chain.id !== publicClient.chain?.id) {
      throw new Error(
        'Wallet client and public client must be connected to the same chain'
      );
    }

    this.chainId = walletClient.chain.id;
    this.addresses = addresses ?? DOPPLER_ADDRESSES[walletClient.chain.id];
  }

  public buildConfig(
    params: DopplerPreDeploymentConfig
  ): DopplerDeploymentConfig {
    return buildConfig(params, this.chainId, this.addresses);
  }

  async deployWithConfig(config: DopplerDeploymentConfig): Promise<Doppler> {
    return await createDoppler(
      this.publicClient,
      this.walletClient,
      this.addresses,
      config
    );
  }
}
