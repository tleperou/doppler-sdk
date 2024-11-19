import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { setupTestEnvironment } from './swapSetup';
import { parseEther } from 'viem';
import { buyAssetExactIn, buyAssetExactOut } from '../../trade/buyAsset';

describe('Doppler Swap tests', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
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
      parseEther('0.00005'),
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
      parseEther('0.00005'),
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
});
