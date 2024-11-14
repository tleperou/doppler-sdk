import { DopplerABI } from '../abis/DopplerABI';
import { Doppler } from '../types';
import { DopplerClients } from '../DopplerSDK';
import { getContract } from 'viem';

export class DopplerPool {
  public readonly doppler: Doppler;
  private readonly clients: DopplerClients;

  constructor(doppler: Doppler, clients: DopplerClients) {
    this.doppler = doppler;
    this.clients = clients;
  }

  contract() {
    return getContract({
      address: this.doppler.address,
      abi: DopplerABI,
      client: this.clients.public,
    });
  }

  async getState<T>(): Promise<T> {
    const state = await this.contract().read.state();
    return state as T;
  }

  //   async getState(): Promise<DopplerState> {
  //   }

  //   async getPositions(): Promise<Position[]> {
  //   }

  //   async canMigrate(): Promise<boolean> {
  //   }
}
