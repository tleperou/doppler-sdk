import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { setupTestEnvironment } from './swapSetup';
import { Address, parseEther } from 'viem';
import { buyAssetExactIn, buyAssetExactOut } from '../../trade/buyAsset';
import { sellAssetExactIn, sellAssetExactOut } from '../../trade/sellAsset';
import { writeContract } from 'viem/actions';
import { DERC20ABI } from '../../abis/DERC20ABI';
import { readContract } from 'viem/actions';
import { fetchDopplerState } from '../../fetch/DopplerState';
describe('Doppler Swap tests', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    const { clients, addressProvider, pool } = testEnv;
    if (!clients.wallet || !clients.wallet.account || !clients.test) {
      throw new Error('Required clients not found');
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

    // sell 10% of the balance
    const amountToSell = balance / BigInt(10);

    const sellExactInTxHash = await sellAssetExactIn(
      pool.doppler,
      addressProvider,
      amountToSell,
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

  it('Should sell asset with exact out', async () => {
    const { clients, pool, addressProvider } = testEnv;
    if (
      !clients.test ||
      !clients.wallet?.account?.address ||
      !clients.wallet?.chain
    ) {
      throw new Error('Test client not found');
    }

    const manager = addressProvider.getAddresses().poolManager;
    const managerBalance = await clients.public.getBalance({
      address: manager,
    });

    const poolState = await fetchDopplerState(
      pool.doppler.address,
      pool.doppler.poolId,
      addressProvider,
      clients.public
    );

    // swap for 10% of the manager balance
    const amountOut = managerBalance / BigInt(10);

    expect(amountOut).toBeLessThan(poolState.totalProceeds);
    const sellExactOutTxHash = await sellAssetExactOut(
      pool.doppler,
      addressProvider,
      amountOut,
      clients.wallet
    );
    await clients.public.waitForTransactionReceipt({
      hash: sellExactOutTxHash,
    });

    const receipt = await clients.public.getTransactionReceipt({
      hash: sellExactOutTxHash,
    });
    expect(receipt.status).toBe('success');
  });
});
