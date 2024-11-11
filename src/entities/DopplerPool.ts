import { Doppler } from '../types';
import { DopplerClients } from '../DopplerSDK';

export class DopplerPool {
  private readonly doppler: Doppler;
  private readonly clients: DopplerClients;

  constructor(doppler: Doppler, clients: DopplerClients) {
    this.doppler = doppler;
    this.clients = clients;
  }

  //   async getState(): Promise<DopplerState> {
  //   }

  //   async getPositions(): Promise<Position[]> {
  //   }

  //   async canMigrate(): Promise<boolean> {
  //   }
}
