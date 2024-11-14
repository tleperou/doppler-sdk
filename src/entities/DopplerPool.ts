import { DopplerABI } from '../abis/DopplerABI';
import { Doppler, DopplerState } from '../types';
import { DopplerClients } from '../DopplerSDK';
import { readContract } from 'viem/actions';
export class DopplerPool {
  public readonly doppler: Doppler;
  private readonly clients: DopplerClients;

  constructor(doppler: Doppler, clients: DopplerClients) {
    this.doppler = doppler;
    this.clients = clients;
  }

  async getState(): Promise<DopplerState> {
    const state = await readContract(this.clients.public, {
      address: this.doppler.address,
      abi: DopplerABI,
      functionName: 'state',
    });
    const feesAccrued = state[5];
    // Convert bigint to bytes and extract amounts using bit operations
    const amount0 = feesAccrued >> BigInt(128); // arithmetic right shift for high bits
    const amount1 = feesAccrued & ((BigInt(1) << BigInt(128)) - BigInt(1)); // mask low bits

    return {
      lastEpoch: state[0],
      tickAccumulator: state[1],
      totalTokensSold: state[2],
      totalProceeds: state[3],
      totalTokensSoldLastEpoch: state[4],
      feesAccrued: { amount0, amount1 },
    };
  }

  //   async getPositions(): Promise<Position[]> {
  //   }

  //   async canMigrate(): Promise<boolean> {
  //   }
}
