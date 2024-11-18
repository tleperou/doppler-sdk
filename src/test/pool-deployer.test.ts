import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestEnvironment } from './setup';
import { parseEther } from 'viem';
import { DopplerConfigParams } from '../PoolDeployer';
import { DopplerConfigBuilder } from '../utils';
import { DopplerAddressProvider } from '../AddressProvider';
import { fetchDopplerState } from '../fetch/DopplerState';
import { fetchPositionState } from '../fetch/PositionState';
import { buyAsset } from '../trade/buyAsset';

describe('Doppler Pool Deployment', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  it('should deploy a new Doppler pool', async () => {
    if (!testEnv.clients.test || !testEnv.clients.wallet) {
      throw new Error('Test client not found');
    }
    const block = await testEnv.clients.public.getBlock();
    const addressProvider = new DopplerAddressProvider(
      31337,
      testEnv.addresses
    );

    const configParams: DopplerConfigParams = {
      name: 'Gud Coin',
      symbol: 'GUD',
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
      addressProvider
    );
    const { pool } = await testEnv.sdk.deployer.deploy(config);

    expect(pool.doppler.address).toBeDefined();
    expect(pool.doppler.deploymentTx).toBeDefined();

    await testEnv.clients.test?.increaseTime({ seconds: 24 * 60 * 60 });
    const slugs = await fetchPositionState(
      pool.doppler.address,
      testEnv.clients.public
    );

    const state = await fetchDopplerState(
      pool.doppler.address,
      pool.doppler.poolId,
      addressProvider,
      testEnv.clients.public
    );

    expect(slugs[0].liquidity).toEqual(BigInt(0));
    expect(slugs[1].liquidity).toBeGreaterThan(BigInt(0));
    expect(slugs[2].liquidity).toBeGreaterThan(BigInt(0));
    const tx = await buyAsset(
      pool.doppler,
      addressProvider,
      parseEther('0.0005'),
      testEnv.clients.wallet
    );
    expect(tx).toBeDefined();
  });
});
