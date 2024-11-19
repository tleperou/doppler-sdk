import { Doppler } from '../types';
import { Clients } from '../DopplerSDK';

export class DopplerPool {
  public readonly doppler: Doppler;
  private readonly clients: Clients;

  constructor(doppler: Doppler, clients: Clients) {
    this.doppler = doppler;
    this.clients = clients;
  }
}
