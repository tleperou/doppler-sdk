import { Address, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { DopplerSDK } from '../DopplerSDK';

// Test accounts from anvil
const TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export async function setupTestEnvironment() {
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http('http://127.0.0.1:8545'),
  });

  const walletClient = createWalletClient({
    account: privateKeyToAccount(TEST_PRIVATE_KEY),
    chain: foundry,
    transport: http('http://127.0.0.1:8545'),
  });

  // Deploy your contracts here and get their addresses
  // You'll need to deploy: poolManager, airlock, tokenFactory, etc.
  const addresses = {
    airlock: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as Address,
    tokenFactory: '0x0165878A594ca255338adfa4d48449f69242Eb8F' as Address,
    dopplerFactory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as Address,
    governanceFactory: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as Address,
    migrator: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6' as Address,
    poolManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
    stateView: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as Address,
  };

  const sdk = new DopplerSDK(
    { public: publicClient, wallet: walletClient },
    {
      addresses,
    }
  );

  return {
    sdk,
    publicClient,
    walletClient,
    addresses,
  };
}
