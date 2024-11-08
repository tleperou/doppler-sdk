import { PublicClient } from 'viem'
import { DopplerPool } from './entities'
import { Hash } from 'viem'

export class GovernanceManager {
  private readonly client: PublicClient
  
  constructor(client: PublicClient) {
    this.client = client
  }

//   async createProposal(pool: DopplerPool, proposal: ProposalData): Promise<Hash> {
//     // Create governance proposal
//   }
  
//   async vote(pool: DopplerPool, proposalId: number, support: boolean): Promise<Hash> {
//     // Vote on proposal
//   }
}