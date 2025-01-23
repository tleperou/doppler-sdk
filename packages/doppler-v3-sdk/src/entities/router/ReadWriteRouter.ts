import { ReadWriteContract, ReadWriteAdapter, Drift } from '@delvtech/drift';
import { basicRouterAbi } from '@/abis';
import { Address, Hex } from 'viem';
import { PoolKey } from '@/types';

export type TradeParams = {
  pool: Address;
  recipient: Address;
  zeroForOne: boolean;
  deadline: bigint;
};

export type ExactInSingleV3Params = TradeParams & {
  amountIn: bigint;
  amountOutMinimum: bigint;
};

export type ExactOutSingleV3Params = TradeParams & {
  amountOut: bigint;
  amountInMaximum: bigint;
};

export type ExactInSingleV4Params = TradeParams & {
  amountIn: bigint;
  amountOutMinimum: bigint;
  key: PoolKey;
  hookData: Hex;
};

export type ExactOutSingleV4Params = TradeParams & {
  amountOut: bigint;
  amountInMaximum: bigint;
  key: PoolKey;
  hookData: Hex;
};

type BasicRouterABI = typeof basicRouterAbi;

export class ReadWriteRouter {
  contract: ReadWriteContract<BasicRouterABI>;

  constructor(address: Address, drift: Drift<ReadWriteAdapter> = new Drift()) {
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
