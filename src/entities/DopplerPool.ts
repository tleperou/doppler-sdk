import { Doppler } from '../types';
import { Clients } from '../DopplerSDK';

export class DopplerPool {
  private readonly doppler: Doppler;
  private readonly clients: Clients;

  constructor(doppler: Doppler, clients: Clients) {
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
