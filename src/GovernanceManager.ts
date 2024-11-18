import { Clients } from './DopplerSDK';
import { DopplerPool } from './entities';
import { Hash } from 'viem';

export class GovernanceManager {
  private readonly client: Clients;

  constructor(client: Clients) {
    this.client = client;
  }

  //   async createProposal(pool: DopplerPool, proposal: ProposalData): Promise<Hash> {
  //     // Create governance proposal
  //   }

  //   async vote(pool: DopplerPool, proposalId: number, support: boolean): Promise<Hash> {
  //     // Vote on proposal
  //   }
}
