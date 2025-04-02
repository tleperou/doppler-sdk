import {
  ReadWriteContract,
  ReadWriteAdapter,
  Drift,
  ContractWriteOptions,
  OnMinedParam,
} from '@delvtech/drift';
import { Address, Hex } from 'viem';

import { ReadFactory, AirlockABI } from './ReadFactory';
import { CreateParams } from './types';

export class ReadWriteFactory extends ReadFactory {
  declare airlock: ReadWriteContract<AirlockABI>;

  constructor(address: Address, drift: Drift<ReadWriteAdapter>) {
    super(address, drift);
  }

  public async create(
    params: CreateParams,
    options?: ContractWriteOptions & OnMinedParam
  ): Promise<Hex> {
    return this.airlock.write('create', { createData: params }, options);
  }

  /**
   * Migrates an asset's liquidity
   * @param asset The address of the asset to migrate
   * @param options Optional contract write options
   * @returns Transaction hash
   */
  public async migrate(
    asset: Address,
    options?: ContractWriteOptions & OnMinedParam
  ): Promise<Hex> {
    return this.airlock.write('migrate', { asset }, options);
  }
}
