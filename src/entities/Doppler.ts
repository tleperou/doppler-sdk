import { Address, Client, Hash, Hex, PublicClient } from 'viem';
import { Token } from '@uniswap/sdk-core';
import { PoolKey } from '@uniswap/v4-sdk';
import { fetchDopplerState } from '../fetch/doppler/DopplerState';
import { fetchPoolState } from '../fetch/doppler/PoolState';

enum AuctionPhase {
  ACTIVE = 'ACTIVE',
  PRE_AUCTION = 'PRE_AUCTION',
  POST_AUCTION = 'POST_AUCTION',
}

enum AuctionStatus {
  MAXIMUM_REACHED = 'MAXIMUM_REACHED',
  MINIMUM_REACHED = 'MINIMUM_REACHED',
  ACTIVE = 'ACTIVE',
}

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

export interface Position {
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  salt: Hash;
  type: 'lowerSlug' | 'upperSlug' | 'pdSlug';
}

export interface PoolState {
  positions: Position[];
  currentTick: number;
  currentPrice: bigint;
  lastSyncedTimestamp: bigint;
}

export class Doppler {
  public readonly address: Address;
  public readonly stateView: Address;
  public readonly assetToken: Token;
  public readonly quoteToken: Token;
  public readonly poolKey: PoolKey;
  public readonly poolId: Hex;
  public readonly config: HookConfig;

  public state: HookState;
  public poolState: PoolState;
  public lastSyncedTimestamp: bigint;
  public auctionPhase: AuctionPhase;
  public auctionStatus: AuctionStatus;
  public assetsRemaining: bigint;
  public proceedsFromMaximum: bigint;
  public proceedsFromMinimum: bigint;
  public epochsRemaining: number;

  constructor(params: {
    address: Address;
    stateView: Address;
    assetToken: Token;
    quoteToken: Token;
    poolKey: PoolKey;
    poolId: Hex;
    config: HookConfig;
    state: HookState;
    poolState: PoolState;
    timestamp: bigint;
  }) {
    this.address = params.address;
    this.stateView = params.stateView;
    this.assetToken = params.assetToken;
    this.quoteToken = params.quoteToken;
    this.poolKey = params.poolKey;
    this.poolId = params.poolId;
    this.config = params.config;
    this.state = params.state;
    this.poolState = params.poolState;
    this.lastSyncedTimestamp = params.timestamp;

    this.auctionPhase = this.getAuctionPhase();
    this.auctionStatus = this.getAuctionStatus();
    this.assetsRemaining = this.getAssetsRemaining();
    this.proceedsFromMaximum = this.getProceedsDistanceFromMaximum();
    this.proceedsFromMinimum = this.getProceedsDistanceFromMinimum();
    this.epochsRemaining = this.getEpochsRemaining();
  }

  // here we can watch and update state + call other functions
  // eventually we want to listen for the event from the contract
  // the event will contain all of the new state
  public watch(client: PublicClient): () => void {
    const unwatch = client.watchBlocks({
      onBlock: async block => {
        await this.getHookState(client);
        await this.getPoolState(client);
        this.lastSyncedTimestamp = block.timestamp;
      },
    });
    return unwatch;
  }

  public async getPoolState(client: Client): Promise<void> {
    this.poolState = await fetchPoolState(
      this.address,
      this.stateView,
      client,
      this.poolId
    );
  }

  public async getHookState(client: Client): Promise<void> {
    this.state = await fetchDopplerState(this.address, client);
  }

  public getAssetsRemaining(): bigint {
    return this.config.numTokensToSell - this.state.totalTokensSold;
  }

  public getTimeRemaining(): number {
    return Number(this.config.endingTime - this.lastSyncedTimestamp);
  }

  public getTimeElapsed(): number {
    return Number(this.lastSyncedTimestamp - this.config.startingTime);
  }

  public getProceedsDistanceFromMaximum(): bigint {
    return this.config.maximumProceeds - this.state.totalProceeds;
  }

  public getProceedsDistanceFromMinimum(): bigint {
    return this.config.minimumProceeds - this.state.totalProceeds;
  }

  public getEpochsRemaining(): number {
    return this.config.totalEpochs - this.state.lastEpoch;
  }

  public getAuctionPhase(): AuctionPhase {
    if (this.lastSyncedTimestamp < this.config.startingTime) {
      return AuctionPhase.PRE_AUCTION;
    } else if (this.lastSyncedTimestamp < this.config.endingTime) {
      return AuctionPhase.ACTIVE;
    } else {
      return AuctionPhase.POST_AUCTION;
    }
  }

  public getAuctionStatus(): AuctionStatus {
    if (this.state.totalProceeds >= this.config.maximumProceeds) {
      return AuctionStatus.MAXIMUM_REACHED;
    } else if (this.state.totalProceeds <= this.config.minimumProceeds) {
      return AuctionStatus.MINIMUM_REACHED;
    } else {
      return AuctionStatus.ACTIVE;
    }
  }
}
