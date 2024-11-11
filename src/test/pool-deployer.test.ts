import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestEnvironment } from './setup';
import { parseEther } from 'viem';
import { DopplerConfigParams } from '../PoolDeployer';
import { DopplerConfigBuilder } from '../utils';
import { DopplerAddressProvider } from '../AddressProvider';

describe('Doppler Pool Deployment', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  it('should deploy a new Doppler pool', async () => {
    const configParams: DopplerConfigParams = {
      name: 'Test Token',
      symbol: 'TEST',
      totalSupply: parseEther('1000000'),
      numTokensToSell: parseEther('100000'),
      startTimeOffset: 1,
      duration: 7,
      epochLength: 3600,
      priceRange: {
        startPrice: 0.001,
        endPrice: 0.0005,
      },
      tickSpacing: 10,
      fee: 500,
      minProceeds: parseEther('10'),
      maxProceeds: parseEther('1000'),
    };

    const config = DopplerConfigBuilder.buildConfig(
      configParams,
      new DopplerAddressProvider(
        testEnv.publicClient.chain.id,
        testEnv.addresses
      )
    );
    const { doppler, pool } = await testEnv.sdk.deployer.deploy(config);

    expect(doppler.address).toBeDefined();
    expect(doppler.deploymentTx).toBeDefined();
  });
});
