import { Address } from 'viem';
import { Doppler } from './types';

export class DopplerRegistry {
  private static STORAGE_KEY = 'deployed-dopplers';

  private readonly chainId: number;

  constructor(chainId: number) {
    this.chainId = chainId;
  }

  public async addDoppler(deployment: Doppler) {
    const stored = this.getStoredDopplers();
    stored[this.chainId] = stored[this.chainId] || {};
    stored[this.chainId][deployment.address] = deployment;
    this.storeDopplers(stored);
  }

  public getDoppler(poolAddress: Address): Doppler | undefined {
    const stored = this.getStoredDopplers();
    return stored[this.chainId]?.[poolAddress];
  }

  public getAllDopplers(): Doppler[] {
    const stored = this.getStoredDopplers();
    return Object.values(stored[this.chainId] || {});
  }

  private getStoredDopplers(): {
    [chainId: number]: { [poolAddress: string]: Doppler };
  } {
    if (typeof localStorage === 'undefined') return {};

    const stored = localStorage.getItem(DopplerRegistry.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private storeDopplers(dopplers: {
    [chainId: number]: { [poolAddress: string]: Doppler };
  }) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        DopplerRegistry.STORAGE_KEY,
        JSON.stringify(dopplers)
      );
    }
  }
}
