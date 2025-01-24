import { ReadWriteContract, ReadWriteAdapter, Drift } from '@delvtech/drift';
import { basicRouterAbi } from '@/abis';
import { Address, Hex } from 'viem';
import {
  BasicRouterABI,
  ExactInSingleV3Params,
  ExactOutSingleV3Params,
  ExactInSingleV4Params,
  ExactOutSingleV4Params,
} from './types';

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
