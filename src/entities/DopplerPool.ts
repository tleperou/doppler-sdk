import { PublicClient } from "viem"
import { Doppler, DopplerState } from "../types"

export class DopplerPool {
  private readonly doppler: Doppler
  
  private readonly client: PublicClient

  constructor(doppler: Doppler, client: PublicClient) {
    this.doppler = doppler
    this.client = client
  }

//   async getState(): Promise<DopplerState> {
//   }

//   async getPositions(): Promise<Position[]> {
//   }

//   async canMigrate(): Promise<boolean> {
//   }
}