import {
  ReadWriteContract,
  ReadWriteAdapter,
  Drift,
  createDrift,
} from '@delvtech/drift';
import { basicRouterAbi } from '@/abis';
import { Address, Hex } from 'viem';
import { PoolKey } from '@/types';

export interface TradeParams {
  recipient: Address;
  zeroForOne: boolean;
  deadline: bigint;
}

export interface ExactInSingleV3Params extends TradeParams {
  pool: Address;
  amountIn: bigint;
  amountOutMinimum: bigint;
}

export interface ExactOutSingleV3Params extends TradeParams {
  pool: Address;
  amountOut: bigint;
  amountInMaximum: bigint;
}

export interface ExactInSingleV4Params extends TradeParams {
  key: PoolKey;
  amountIn: bigint;
  amountOutMinimum: bigint;
  hookData: Hex;
}

export interface ExactOutSingleV4Params extends TradeParams {
  key: PoolKey;
  amountOut: bigint;
  amountInMaximum: bigint;
  hookData: Hex;
}

export type BasicRouterABI = typeof basicRouterAbi;

export class ReadWriteRouter {
  contract: ReadWriteContract<BasicRouterABI>;

  constructor(
    address: Address,
    drift: Drift<ReadWriteAdapter> = createDrift()
  ) {
    this.contract = drift.contract({
      abi: basicRouterAbi,
      address,
    });
  }

  async exactInputSingleV3(params: ExactInSingleV3Params): Promise<Hex> {
    return this.contract.write('exactInputSingleV3', params);
  }

  async exactOutputSingleV3(params: ExactOutSingleV3Params): Promise<Hex> {
    return this.contract.write('exactOutputSingleV3', params);
  }

  async exactInputSingleV4(params: ExactInSingleV4Params): Promise<Hex> {
    return this.contract.write('exactInputSingleV4', params);
  }

  async exactOutputSingleV4(params: ExactOutSingleV4Params): Promise<Hex> {
    return this.contract.write('exactOutputSingleV4', params);
  }
}
