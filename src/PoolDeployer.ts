import { DopplerPool } from './entities';
import { DeploymentConfig, Doppler } from './types';
import { Token } from '@uniswap/sdk-core';
import { Clients } from './DopplerSDK';
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  getContract,
  toHex,
  Hex,
  WalletClient,
  PublicClient,
  TestClient,
} from 'viem';
import { Pool } from '@uniswap/v4-sdk';
import { DopplerAddressProvider } from './AddressProvider';
import { AirlockABI } from './abis/AirlockABI';
import { waitForTransactionReceipt } from 'viem/actions';

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
  blockTimestamp: number;
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
  private readonly client: Clients;
  private readonly addressProvider: DopplerAddressProvider;

  constructor(clients: Clients, addressProvider: DopplerAddressProvider) {
    this.client = clients;
    this.addressProvider = addressProvider;
  }

  async deploy(config: DeploymentConfig): Promise<{ pool: DopplerPool }> {
    const chainId = this.addressProvider.getChainId();
    const wallet = this.client.wallet;
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
      migrator,
    } = this.addressProvider.getAddresses();

    const dopplerFactoryData = encodeAbiParameters(
      [
        { name: 'minimumProceeds', type: 'uint256' },
        { name: 'maximumProceeds', type: 'uint256' },
        { name: 'startingTime', type: 'uint256' },
        { name: 'endingTime', type: 'uint256' },
        { name: 'startTick', type: 'int24' },
        { name: 'endTick', type: 'int24' },
        { name: 'epochLength', type: 'uint256' },
        { name: 'gamma', type: 'int24' },
        { name: 'isToken0', type: 'bool' },
        { name: 'numPDSlugs', type: 'uint256' },
        { name: 'airlock', type: 'address' },
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
      client: { public: this.client.public, wallet },
    });

    const poolKey = {
      ...config.poolKey,
      currency0: config.poolKey.currency0 as Hex,
      currency1: config.poolKey.currency1 as Hex,
      hooks: config.poolKey.hooks as Hex,
    };

    const currency0 = new Token(chainId, poolKey.currency0, 18);
    const currency1 = new Token(chainId, poolKey.currency1, 18);

    const poolId = Pool.getPoolId(
      currency0,
      currency1,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks
    ) as Hex;

    const createArgs = [
      config.token.name,
      config.token.symbol,
      config.token.totalSupply,
      config.token.totalSupply,
      poolKey,
      [] as Hex[],
      [] as bigint[],
      tokenFactory,
      toHex(''),
      governanceFactory,
      toHex(''),
      dopplerFactory,
      dopplerFactoryData,
      migrator,
      config.salt,
    ] as const;

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
    // TODO: this is a hack to get the timestamp of the block
    // where the airlock contract was deployed
    // TODO: find a better way to get the deployment block
    const createHash = await airlockContract.write.create(createArgs, {
      account: wallet.account,
      chain: this.client.public.chain,
    });
    await waitForTransactionReceipt(this.client.public, {
      hash: createHash,
    });
    const { timestamp } = await this.client.public.getBlock();

    const doppler: Doppler = {
      address: config.dopplerAddress,
      assetToken: config.hook.assetToken,
      quoteToken: config.hook.quoteToken,
      hook: config.dopplerAddress,
      poolKey,
      poolId,
      deployedAt: timestamp,
      deploymentTx: createHash,
    };

    const dopplerPool = new DopplerPool(doppler, this.client);
    return { pool: dopplerPool };
  }
}
