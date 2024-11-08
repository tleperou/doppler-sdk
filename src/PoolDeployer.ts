import { DopplerPool } from './entities';
import { DeploymentConfig, Doppler } from './types';
import { ContractManager } from './ContractManager';
import { Clients } from './DopplerSDK';
import { encodePacked, WalletClient } from 'viem';
import { getPoolKey } from '@uniswap/v4-sdk';
import { Token } from '@uniswap/sdk-core';

export class PoolDeployer {
  private readonly clients: Clients;
  private readonly contracts: ContractManager;

  constructor(clients: Clients, contracts: ContractManager) {
    this.clients = clients;
    this.contracts = contracts;
  }

  async deploy(
    config: DeploymentConfig
  ): Promise<{ doppler: Doppler; pool: DopplerPool }> {
    const wallet = this.clients.wallet;
    if (!wallet?.account?.address) {
      throw new Error(
        'No wallet account found. Please connect a wallet first.'
      );
    }

    const address = wallet.account.address;

    const hookFactoryData = encodePacked(
      [
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'int24',
        'int24',
        'uint256',
        'int24',
        'bool',
        'uint256',
        'address',
      ],
      [
        config.hook.minProceeds,
        config.hook.maxProceeds,
        BigInt(config.hook.startTime),
        BigInt(config.hook.endTime),
        config.hook.startTick,
        config.hook.endTick,
        BigInt(config.hook.epochLength),
        config.hook.gamma,
        false,
        BigInt(config.hook.numPdSlugs),
        this.contracts.airlock().address,
      ]
    );

    const result = await this.contracts
      .airlock()
      .simulate.create(
        [
          config.token.name,
          config.token.symbol,
          config.token.totalSupply,
          config.token.totalSupply,
        ],
        { account: address }
      );
  }
}
