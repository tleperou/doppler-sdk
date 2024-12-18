import {
  ReadContract,
  ReadAdapter,
  Drift,
  EventLog,
  ContractGetEventsOptions,
} from '@delvtech/drift';
import { Address } from 'viem';
import { uniswapV3PoolAbi } from '../../abis';

export type UniswapV3PoolABI = typeof uniswapV3PoolAbi;

export type Slot0 = {
  sqrtPriceX96: bigint;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
};

export class ReadUniswapV3Pool {
  pool: ReadContract<UniswapV3PoolABI>;

  constructor(address: Address, drift: Drift<ReadAdapter> = new Drift()) {
    this.pool = drift.contract({
      abi: uniswapV3PoolAbi,
      address,
    });
  }

  async getMintEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<UniswapV3PoolABI, 'Mint'>[]> {
    return this.pool.getEvents('Mint', {
      ...options,
    });
  }

  async getBurnEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<UniswapV3PoolABI, 'Burn'>[]> {
    return this.pool.getEvents('Burn', {
      ...options,
    });
  }

  async getSwapEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<UniswapV3PoolABI, 'Swap'>[]> {
    return this.pool.getEvents('Swap', {
      ...options,
    });
  }

  async getSlot0(): Promise<Slot0> {
    return this.pool.read('slot0');
  }
}
