import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { setupTestEnvironment } from './swapSetup';
import { Address, parseEther } from 'viem';
import { buyAssetExactIn, buyAssetExactOut } from '../../trade/buyAsset';
import { sellAssetExactIn } from '../../trade/sellAsset';
import { readContract, writeContract } from 'viem/actions';
import { DERC20ABI } from '../../abis/DERC20ABI';

describe('Doppler Swap tests', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    const { clients, addressProvider, pool } = testEnv;
    if (!clients.wallet || !clients.wallet.account) {
      throw new Error('Wallet client not found');
    }
    // max approve
    await writeContract(clients.wallet, {
      chain: clients.wallet.chain,
      account: clients.wallet.account,
      address: pool.doppler.assetToken.address as Address,
      abi: DERC20ABI,
      functionName: 'approve',
      args: [
        addressProvider.getAddresses().customRouter,
        BigInt(1) << (BigInt(256) - BigInt(1)),
      ],
    });
  });

  beforeEach(async () => {
    await testEnv.clients.test?.mine({
      blocks: 1,
    });
  });

  it('should buy asset with exact out', async () => {
    const { clients, pool, addressProvider } = testEnv;
    if (!clients.test || !clients.wallet) {
      throw new Error('Test client not found');
    }

    const buyExactOutTxHash = await buyAssetExactOut(
      pool.doppler,
      addressProvider,
      parseEther('0.05'),
      clients.wallet
    );
    await clients.public.waitForTransactionReceipt({
      hash: buyExactOutTxHash,
    });

    const receipt = await clients.public.getTransactionReceipt({
      hash: buyExactOutTxHash,
    });
    expect(receipt.status).toBe('success');
  });

  it('should buy asset with exact in', async () => {
    const { clients, pool, addressProvider } = testEnv;
    if (!clients.test || !clients.wallet) {
      throw new Error('Test client not found');
    }

    const buyExactInTxHash = await buyAssetExactIn(
      pool.doppler,
      addressProvider,
      parseEther('0.05'),
      clients.wallet
    );
    await clients.public.waitForTransactionReceipt({
      hash: buyExactInTxHash,
    });

    const receipt = await clients.public.getTransactionReceipt({
      hash: buyExactInTxHash,
    });
    expect(receipt.status).toBe('success');
  });

  it('should sell asset with exact in', async () => {
    const { clients, pool, addressProvider } = testEnv;
    if (
      !clients.test ||
      !clients.wallet?.account?.address ||
      !clients.wallet?.chain
    ) {
      throw new Error('Test client not found');
    }
    const tokenAddress = pool.doppler.assetToken.address;
    const balance = await readContract(clients.test, {
      address: tokenAddress as Address,
      abi: DERC20ABI,
      functionName: 'balanceOf',
      args: [clients.wallet.account.address],
    });

    const sellExactInTxHash = await sellAssetExactIn(
      pool.doppler,
      addressProvider,
      balance,
      clients.wallet
    );
    await clients.public.waitForTransactionReceipt({
      hash: sellExactInTxHash,
    });

    const receipt = await clients.public.getTransactionReceipt({
      hash: sellExactInTxHash,
    });
    expect(receipt.status).toBe('success');
  });
});
