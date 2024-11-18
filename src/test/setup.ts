import {
  Address,
  createTestClient,
  http,
  publicActions,
  walletActions,
} from 'viem';
import { Clients, DopplerSDK } from '../DopplerSDK';
import { foundry } from 'viem/chains';
import { DopplerAddresses } from '../AddressProvider';
import { privateKeyToAccount } from 'viem/accounts';
import {
  DeployDopplerFactoryABI,
  DeployDopplerFactoryDeployedBytecode,
} from './abis/DeployDopplerFactoryABI';
import { randomBytes } from 'crypto';

interface TestEnvironment {
  sdk: DopplerSDK;
  clients: Clients;
  addresses: DopplerAddresses;
}

const ANVIL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const deploymentFactoryAddress = `0x${randomBytes(20).toString(
  'hex'
)}` as Address;

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  const publicClient = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  }).extend(publicActions);

  const walletClient = createTestClient({
    account: privateKeyToAccount(ANVIL_PRIVATE_KEY),
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  }).extend(walletActions);

  const testClient = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
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

  const sdk = new DopplerSDK(
    { public: publicClient, wallet: walletClient },
    {
      addresses,
    }
  );

  return {
    sdk,
    clients: { public: publicClient, wallet: walletClient, test: testClient },
    addresses,
  };
}
