import { DopplerPool } from './entities';
import { DeploymentConfig, Doppler } from './types';
import { Clients } from './DopplerSDK';
import {
  BaseError,
  ContractFunctionRevertedError,
  decodeFunctionResult,
  encodePacked,
  getContract,
  toBytes,
} from 'viem';
import { AddressProvider } from './AddressProvider';
import { AirlockABI } from './abis/AirlockABI';

export class PoolDeployer {
  private readonly clients: Clients;
  private readonly addressProvider: AddressProvider;

  constructor(clients: Clients, addressProvider: AddressProvider) {
    this.clients = clients;
    this.addressProvider = addressProvider;
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

    const {
      airlock,
      tokenFactory,
      governanceFactory,
      dopplerFactory,
    } = this.addressProvider.getAddresses();

    const dopplerFactoryData = encodePacked(
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
        airlock,
      ]
    );

    const airlockContract = getContract({
      address: airlock,
      abi: AirlockABI,
      client: { public: this.clients.public, wallet: wallet },
    });

    const createArgs = [
      config.token.name,
      config.token.symbol,
      config.token.totalSupply,
      config.token.totalSupply,
      config.poolKey,
      [],
      [],
      tokenFactory,
      toBytes(''),
      governanceFactory,
      toBytes(''),
      dopplerFactory,
      dopplerFactoryData,
      airlock,
      config.salt,
    ];

    try {
      await airlockContract.simulate.create(createArgs);
    } catch (err) {
      if (err instanceof BaseError) {
        const revertError = err.walk(
          err => err instanceof ContractFunctionRevertedError
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? '';
          if (errorName === 'DUPLICATE_POOL_KEY') {
            throw new Error('Pool key already exists');
          }
        }
      }
    }
    const receipt = await airlockContract.write.create(createArgs);
    const { blockNumber } = await this.clients.public.getTransactionReceipt({
      hash: receipt,
    });
    const { timestamp } = await this.clients.public.getBlock({
      blockNumber,
    });

    const doppler: Doppler = {
      address: config.dopplerAddress,
      assetToken: config.hook.assetToken,
      quoteToken: config.hook.quoteToken,
      hook: config.dopplerAddress,
      poolKey: config.poolKey,
      deployedAt: timestamp,
      deploymentTx: receipt,
    };

    const dopplerPool = new DopplerPool(doppler, this.clients);
    return { doppler, pool: dopplerPool };
  }
}
