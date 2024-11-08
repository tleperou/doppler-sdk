import { PublicClient } from 'viem'
import { DopplerPool, Position } from './entities'

export class PoolManager {
  private readonly client: PublicClient
  private readonly dopplerPool: DopplerPool

  constructor(client: PublicClient, dopplerPool: DopplerPool) {
    this.client = client
    this.dopplerPool = dopplerPool
  }

  // async getPositions(pool: DopplerPool): Promise<Position[]> {
  // }
}
