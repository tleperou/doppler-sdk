import { randomBytes } from 'crypto';
import {
  Address,
  createPublicClient,
  createTestClient,
  createWalletClient,
  Hex,
  http,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import {
  sdkDeployerAbi,
  sdkDeployerDeployedBytecode,
} from '../abis/DeployDopplerFactoryABI';
import { Clients, DopplerV4Addresses } from '../../types';

interface TestEnvironment {
  clients: Clients;
  addresses: DopplerV4Addresses;
}

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  const privateKey = `0x${randomBytes(32).toString('hex')}` as Hex;
  const deploymentFactoryAddress = `0x${randomBytes(20).toString(
    'hex'
  )}` as Address;

  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: foundry,
    transport: http(),
  });

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
    bytecode: sdkDeployerDeployedBytecode,
  });

  const deployContractsHash = await walletClient.writeContract({
    abi: sdkDeployerAbi,
    address: deploymentFactoryAddress,
    functionName: 'deploy',
    account: walletClient.account,
  });

  await publicClient.waitForTransactionReceipt({
    hash: deployContractsHash,
  });

  const {
    airlock,
    tokenFactory,
    dopplerDeployer,
    uniswapV4Initializer,
    uniswapV3Initializer,
    governanceFactory,
    uniswapV2LiquidityMigrator,
    manager,
    universalRouter,
    basicRouter,
  } = await publicClient.readContract({
    abi: sdkDeployerAbi,
    address: deploymentFactoryAddress,
    functionName: 'getAddrs',
  });

  // Deploy your contracts here and get their addresses
  // You'll need to deploy: poolManager, airlock, tokenFactory, etc.
  // TODO: Fix this
  const addresses = {
    airlock,
    tokenFactory,
    dopplerDeployer,
    v4Initializer: uniswapV4Initializer,
    v3Initializer: uniswapV3Initializer,
    governanceFactory,
    migrator: uniswapV2LiquidityMigrator,
    poolManager: manager,
    universalRouter,
    basicRouter,
  };

  return {
    clients: { publicClient, walletClient, testClient },
    addresses,
  };
}
