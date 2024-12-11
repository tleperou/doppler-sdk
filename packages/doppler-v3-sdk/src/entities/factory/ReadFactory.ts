import { ReadContract, ReadAdapter, Drift, EventLog } from '@delvtech/drift';
import { Address } from 'viem';
import { airlockAbi } from '@/abis';

export type AirlockABI = typeof airlockAbi;

export enum ModuleState {
  NotWhitelisted = 0,
  TokenFactory = 1,
  GovernanceFactory = 2,
  HookFactory = 3,
  Migrator = 4,
}

export interface AssetData {
  pool: Address;
  timelock: Address;
  governance: Address;
  liquidityMigrator: Address;
  migrationPool: Address;
}

export class ReadFactory {
  airlock: ReadContract<AirlockABI>;

  constructor(address: Address, drift: Drift<ReadAdapter> = new Drift()) {
    this.airlock = drift.contract({
      abi: airlockAbi,
      address,
    });
  }

  async getModuleState(address: Address): Promise<ModuleState> {
    return this.airlock.read('getModuleState', {
      module: address,
    });
  }

  async getAssetData(asset: Address): Promise<AssetData> {
    return this.airlock.read('getAssetData', {
      asset,
    });
  }

  async getCreateEvents(): Promise<EventLog<AirlockABI, 'Create'>[]> {
    return this.airlock.getEvents('Create');
  }

  async getMigrateEvents(): Promise<EventLog<AirlockABI, 'Migrate'>[]> {
    return this.airlock.getEvents('Migrate');
  }

  async getSetModuleStateEvents(): Promise<
    EventLog<AirlockABI, 'SetModuleState'>[]
  > {
    return this.airlock.getEvents('SetModuleState');
  }
}
