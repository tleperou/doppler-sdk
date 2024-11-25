import { Doppler } from '../../entities/Doppler';
import { DopplerDeploymentConfig } from '../../entities/Deployer';
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  getContract,
  toHex,
  Hex,
  PublicClient,
  WalletClient,
  keccak256,
  encodePacked,
} from 'viem';
import { DopplerAddresses } from '../../types';
import { AirlockABI } from '../../abis';
import { waitForTransactionReceipt } from 'viem/actions';
import {
  fetchDopplerImmutables,
  fetchDopplerState,
} from '../../fetch/doppler/DopplerState';
import { fetchPoolState } from '../../fetch/doppler/PoolState';

export async function createDoppler(
  publicClient: PublicClient,
  walletClient: WalletClient,
  addresses: DopplerAddresses,
  config: DopplerDeploymentConfig
): Promise<Doppler> {
  if (!walletClient?.account?.address || !walletClient?.chain?.id) {
    throw new Error('No wallet account found. Please connect a wallet first.');
  }

  const chainId = walletClient.chain.id;

  if (chainId !== publicClient.chain?.id) {
    throw new Error('Wallet and public client are not on the same chain');
  }

  const {
    airlock,
    stateView,
    tokenFactory,
    governanceFactory,
    dopplerFactory,
    migrator,
  } = addresses;

  const poolKey = {
    ...config.poolKey,
    currency0: config.poolKey.currency0 as Hex,
    currency1: config.poolKey.currency1 as Hex,
    hooks: config.poolKey.hooks as Hex,
  };

  const tokenA =
    poolKey.currency0.toLowerCase() > poolKey.currency1.toLowerCase()
      ? poolKey.currency1
      : poolKey.currency0;
  const tokenB =
    poolKey.currency0.toLowerCase() > poolKey.currency1.toLowerCase()
      ? poolKey.currency0
      : poolKey.currency1;

  const poolId = keccak256(
    encodePacked(
      ['address', 'address', 'uint24', 'uint24', 'address'],
      [tokenA, tokenB, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
    )
  );

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
    client: walletClient,
  });

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
    account: walletClient.account,
    chain: walletClient.chain,
  });
  await waitForTransactionReceipt(publicClient, {
    hash: createHash,
  });

  const [
    { timestamp },
    dopplerConfig,
    dopplerState,
    poolState,
  ] = await Promise.all([
    publicClient.getBlock(),
    fetchDopplerImmutables(config.dopplerAddress, publicClient),
    fetchDopplerState(config.dopplerAddress, publicClient),
    fetchPoolState(config.dopplerAddress, stateView, publicClient, poolId),
  ]);

  const doppler = new Doppler({
    address: config.dopplerAddress,
    stateView,
    assetToken: config.hook.assetToken,
    quoteToken: config.hook.quoteToken,
    poolKey,
    poolId,
    config: dopplerConfig,
    state: dopplerState,
    timestamp,
    poolState,
  });

  return doppler;
}
