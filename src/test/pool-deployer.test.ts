import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestEnvironment } from './setup';
import { parseEther } from 'viem';
import { DopplerConfigParams } from '../PoolDeployer';
import { DopplerConfigBuilder } from '../utils';
import { DopplerAddressProvider } from '../AddressProvider';
import { fetchDopplerState } from '../fetch/DopplerState';
import { fetchPositionState } from '../fetch/PositionState';

describe('Doppler Pool Deployment', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  it('should deploy a new Doppler pool', async () => {
    const block = await testEnv.publicClient.getBlock();
    const addressProvider = new DopplerAddressProvider(
      testEnv.publicClient.chain.id,
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
    const slugs = await fetchPositionState(
      pool.doppler.address,
      testEnv.publicClient
    );

    console.log(slugs);

    const state = await fetchDopplerState(
      pool.doppler.address,
      pool.doppler.poolId,
      addressProvider,
      testEnv.publicClient
    );

    console.log(state);
    expect(slugs[0].liquidity).toBeDefined();
    expect(slugs[1].liquidity).toBeDefined();
    expect(slugs[2].liquidity).toBeDefined();
  });
});
