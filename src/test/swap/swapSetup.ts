import {
  Address,
  Hex,
  createTestClient,
  http,
  parseEther,
  publicActions,
  walletActions,
} from 'viem';
import { Clients, DopplerSDK } from '../../DopplerSDK';
import { foundry } from 'viem/chains';
import { DopplerAddressProvider } from '../../AddressProvider';
import { privateKeyToAccount } from 'viem/accounts';
import {
  DeployDopplerFactoryABI,
  DeployDopplerFactoryDeployedBytecode,
} from '../abis/DeployDopplerFactoryABI';
import { randomBytes } from 'crypto';
import { DopplerConfigParams } from '../../PoolDeployer';
import { DopplerConfigBuilder } from '../../utils';
import { DopplerABI } from '../../abis/DopplerABI';
import { readContract } from 'viem/actions';
import { Doppler } from '../../types';

interface SwapTestEnvironment {
  sdk: DopplerSDK;
  clients: Clients;
  addressProvider: DopplerAddressProvider;
  doppler: Doppler;
}

export async function setupTestEnvironment(): Promise<SwapTestEnvironment> {
  const privateKey = `0x${randomBytes(32).toString('hex')}` as Hex;
  const deploymentFactoryAddress = `0x${randomBytes(20).toString(
    'hex'
  )}` as Address;

  const publicClient = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  }).extend(publicActions);

  const walletClient = createTestClient({
    account: privateKeyToAccount(privateKey),
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  }).extend(walletActions);

  const testClient = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  });

  testClient.setBalance({
    address: privateKeyToAccount(privateKey).address,
    value: parseEther('1000000'),
  });

  testClient.setCode({
    address: deploymentFactoryAddress,
    bytecode: DeployDopplerFactoryDeployedBytecode,
  });

  const deployContractsHash = await walletClient.writeContract({
    abi: DeployDopplerFactoryABI,
    address: deploymentFactoryAddress,
    functionName: 'run',
    account: walletClient.account,
  });

  await publicClient.waitForTransactionReceipt({
    hash: deployContractsHash,
  });

  const contractAddresses = await publicClient.readContract({
    abi: DeployDopplerFactoryABI,
    address: deploymentFactoryAddress,
    functionName: 'getDeploymentAddresses',
  });

  // Deploy your contracts here and get their addresses
  // You'll need to deploy: poolManager, airlock, tokenFactory, etc.
  const addresses = {
    airlock: contractAddresses[0] as Address,
    tokenFactory: contractAddresses[1] as Address,
    dopplerFactory: contractAddresses[2] as Address,
    governanceFactory: contractAddresses[3] as Address,
    migrator: contractAddresses[4] as Address,
    poolManager: contractAddresses[5] as Address,
    stateView: contractAddresses[6] as Address,
    customRouter: contractAddresses[7] as Address,
  };

  const addressProvider = new DopplerAddressProvider(31337, addresses);
  const sdk = new DopplerSDK(
    { public: publicClient, wallet: walletClient },
    {
      addresses,
    }
  );

  const block = await publicClient.getBlock();

  const configParams: DopplerConfigParams = {
    name: 'Swap Coin',
    symbol: 'SWAP',
    totalSupply: parseEther('1000'),
    numTokensToSell: parseEther('1000'),
    blockTimestamp: Number(block.timestamp),
    startTimeOffset: 1,
    duration: 3,
    epochLength: 1600,
    priceRange: {
      startPrice: 0.1,
      endPrice: 0.0001,
    },
    tickSpacing: 8,
    fee: 300,
    minProceeds: parseEther('100'),
    maxProceeds: parseEther('600'),
  };

  const config = DopplerConfigBuilder.buildConfig(
    configParams,
    publicClient.chain.id,
    addressProvider
  );
  const doppler = await sdk.deployer.deploy(config);

  // jump to starting time
  const startingTime = await readContract(publicClient, {
    address: doppler.address,
    abi: DopplerABI,
    functionName: 'startingTime',
    args: [],
  });
  const { timestamp } = await publicClient.getBlock();
  const delta = Number(startingTime) - Number(timestamp);
  await testClient.increaseTime({
    seconds: delta + 1,
  });
  await testClient.mine({
    blocks: 1,
  });

  return {
    sdk,
    clients: { public: publicClient, wallet: walletClient, test: testClient },
    addressProvider,
    doppler,
  };
}
