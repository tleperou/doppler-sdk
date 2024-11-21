import { Address, Client, Hex, PublicClient } from 'viem';
import { Token } from '@uniswap/sdk-core';
import { PoolKey } from '@uniswap/v4-sdk';
import { fetchDopplerState } from '../../fetch/doppler/DopplerState';

export interface HookConfig {
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

export interface HookState {
  lastEpoch: number;
  tickAccumulator: bigint;
  totalTokensSold: bigint;
  totalProceeds: bigint;
  totalTokensSoldLastEpoch: bigint;
  feesAccrued: {
    amount0: bigint;
    amount1: bigint;
  };
}

export class Hook {
  public readonly address: Address;
  public readonly assetToken: Token;
  public readonly quoteToken: Token;
  public readonly poolKey: PoolKey;
  public readonly poolId: Hex;
  public readonly config: HookConfig;
  public state: HookState;

  constructor(params: {
    address: Address;
    assetToken: Token;
    quoteToken: Token;
    poolKey: PoolKey;
    poolId: Hex;
    config: HookConfig;
    state: HookState;
  }) {
    this.address = params.address;
    this.assetToken = params.assetToken;
    this.quoteToken = params.quoteToken;
    this.poolKey = params.poolKey;
    this.poolId = params.poolId;
    this.config = params.config;
    this.state = params.state;
  }

  public async fetchState(client: Client): Promise<void> {
    this.state = await fetchDopplerState(this.address, client);
  }

  // here we can watch and update state + call other functions
  // eventually we want to listen for the event from the contract
  // the event will contain all of the new state
  public watch(client: PublicClient): () => void {
    const unwatch = client.watchBlocks({
      onBlock: async () => {
        await this.fetchState(client);
      },
    });
    return unwatch;
  }

  public tokensRemaining(): bigint {
    return this.config.numTokensToSell - this.state.totalTokensSold;
  }
}
