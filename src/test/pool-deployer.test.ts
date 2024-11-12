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
      totalSupply: parseEther('1000'),
      numTokensToSell: parseEther('1000'),
      startTimeOffset: 1,
      duration: 3,
      epochLength: 400,
      priceRange: {
        startPrice: 0.1,
        endPrice: 0.0001,
      },
      tickSpacing: 8,
      fee: 500,
      minProceeds: parseEther('100'),
      maxProceeds: parseEther('600'),
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
