import {
  ReadContract,
  ReadAdapter,
  Drift,
  EventLog,
  ContractGetEventsOptions,
  ContractReadOptions,
} from '@delvtech/drift';
import { Address } from 'viem';
import { airlockAbi } from '../../abis';

export type AirlockABI = typeof airlockAbi;

export enum ModuleState {
  NotWhitelisted = 0,
  TokenFactory = 1,
  GovernanceFactory = 2,
  HookFactory = 3,
  Migrator = 4,
}

export interface AssetData {
  numeraire: Address;
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

  async getModuleState(
    address: Address,
    options?: ContractReadOptions
  ): Promise<ModuleState> {
    return this.airlock.read('getModuleState', {
      module: address,
      ...options,
    });
  }

  async getAssetData(
    asset: Address,
    options?: ContractReadOptions
  ): Promise<AssetData> {
    return this.airlock.read('getAssetData', {
      asset,
      ...options,
    });
  }

  async getCreateEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<AirlockABI, 'Create'>[]> {
    return this.airlock.getEvents('Create', {
      ...options,
    });
  }

  async getMigrateEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<AirlockABI, 'Migrate'>[]> {
    return this.airlock.getEvents('Migrate', {
      ...options,
    });
  }

  async getSetModuleStateEvents(
    options?: ContractGetEventsOptions
  ): Promise<EventLog<AirlockABI, 'SetModuleState'>[]> {
    return this.airlock.getEvents('SetModuleState', {
      ...options,
    });
  }
}
