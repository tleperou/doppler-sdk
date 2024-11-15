import { Doppler } from '../types';
import { DopplerClients } from '../DopplerSDK';

export class DopplerPool {
  public readonly doppler: Doppler;
  private readonly clients: DopplerClients;

  constructor(doppler: Doppler, clients: DopplerClients) {
    this.doppler = doppler;
    this.clients = clients;
  }
}
