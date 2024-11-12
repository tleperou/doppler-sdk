import { DopplerPool } from './entities';
import { DeploymentConfig, Doppler } from './types';
import { DopplerClients } from './DopplerSDK';
import {
  BaseError,
  ContractFunctionRevertedError,
  encodePacked,
  getContract,
  toBytes,
  toHex,
} from 'viem';
import { DopplerAddressProvider } from './AddressProvider';
import { AirlockABI } from './abis/AirlockABI';

// this maps onto the tick range, startingTick -> endingTick
export interface PriceRange {
  startPrice: number;
  endPrice: number;
}

export interface DopplerConfigParams {
  // Token details
  name: string;
  symbol: string;
  totalSupply: bigint;
  numTokensToSell: bigint;

  // Time parameters
  startTimeOffset: number; // in days from now
  duration: number; // in days
  epochLength: number; // in seconds

  // Price parameters
  priceRange: PriceRange;
  tickSpacing: number;
  fee: number; // In bips

  // Sale parameters
  minProceeds: bigint;
  maxProceeds: bigint;
  numPdSlugs?: number; // uses a default if not set
}

export class PoolDeployer {
  private readonly clients: DopplerClients;
  private readonly addressProvider: DopplerAddressProvider;

  constructor(
    clients: DopplerClients,
    addressProvider: DopplerAddressProvider
  ) {
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
      toHex(''),
      governanceFactory,
      toHex(''),
      dopplerFactory,
      dopplerFactoryData,
      airlock,
      config.salt,
    ];

    // try {
    //   const receipt = await airlockContract.simulate.create(createArgs);
    //   console.log('receipt', receipt);
    // } catch (err) {
    //   if (err instanceof BaseError) {
    //     const revertError = err.walk(
    //       err => err instanceof ContractFunctionRevertedError
    //     );
    //     if (revertError instanceof ContractFunctionRevertedError) {
    //       const errorName = revertError.data?.errorName ?? '';
    //       if (errorName === 'DUPLICATE_POOL_KEY') {
    //         throw new Error('Pool key already exists');
    //       }
    //     }
    //   }
    // }
    console.log('createArgs', createArgs);
    const receipt = await airlockContract.write.create(createArgs);
    console.log('receipt', receipt);
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
