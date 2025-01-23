import { parseEther } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { setupTestEnvironment } from './setup';
import { buildConfig, ReadWriteFactory } from '../../entities/factory';
import { DopplerPreDeploymentConfig } from '../../types';
import { airlockAbi } from '../../abis';
import { unichainSepolia } from 'viem/chains';
describe('Doppler Pool Deployment', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  it('should mine and create a new pool', async () => {
    const {
      clients: { publicClient, walletClient },
      addresses,
    } = testEnv;
    if (!publicClient || !walletClient || !walletClient.account) {
      throw new Error('Test client not found');
    }

    const { timestamp } = await publicClient.getBlock();
    const configParams: DopplerPreDeploymentConfig = {
      name: 'Gud Coin',
      symbol: 'GUD',
      totalSupply: parseEther('10000'),
      numTokensToSell: parseEther('1000'),
      tokenURI: 'https://gudcoin.com',
      blockTimestamp: Number(timestamp),
      startTimeOffset: 1,
      duration: 3,
      epochLength: 1600,
      priceRange: {
        startPrice: 0.1,
        endPrice: 0.0001,
      },
      tickSpacing: 8,
      fee: 3000,
      minProceeds: parseEther('100'),
      maxProceeds: parseEther('600'),
    };

    const config = buildConfig(configParams, addresses);
    const simulateData = await publicClient.simulateContract({
      address: addresses.airlock,
      abi: airlockAbi,
      functionName: 'create',
      args: [config],
    });

    const txHash = await walletClient.writeContract({
      address: addresses.airlock,
      abi: airlockAbi,
      functionName: 'create',
      args: [config],
      account: walletClient.account,
      chain: unichainSepolia,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    expect(receipt.status).toEqual('success');
  });
});
