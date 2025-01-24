import { ReadContract, Drift, ReadAdapter } from '@delvtech/drift';
import { Address } from 'viem';
import {
  BasicRouterABI,
  ExactInSingleV3Params,
  ExactOutSingleV3Params,
  ExactInSingleV4Params,
  ExactOutSingleV4Params,
} from './types';
import { basicRouterAbi } from '@/abis';

export class ReadRouter {
  contract: ReadContract<BasicRouterABI>;

  constructor(address: Address, drift: Drift<ReadAdapter> = new Drift()) {
    this.contract = drift.contract({
      abi: basicRouterAbi,
      address,
    });
  }

  async exactInputSingleV3(params: ExactInSingleV3Params): Promise<bigint> {
    return this.contract.simulateWrite('exactInputSingleV3', params);
  }

  async exactOutputSingleV3(params: ExactOutSingleV3Params): Promise<bigint> {
    return this.contract.simulateWrite('exactOutputSingleV3', params);
  }

  async exactInputSingleV4(params: ExactInSingleV4Params): Promise<bigint> {
    return this.contract.simulateWrite('exactInputSingleV4', params);
  }

  async exactOutputSingleV4(params: ExactOutSingleV4Params): Promise<bigint> {
    return this.contract.simulateWrite('exactOutputSingleV4', params);
  }
}
