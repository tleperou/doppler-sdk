import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestEnvironment } from './setup';
import { parseEther } from 'viem';
import {
  deployDoppler,
  DopplerConfigParams,
} from '../../actions/deploy/deployDoppler';
import { DopplerConfigBuilder } from '../../actions/deploy/configBuilder';
import { fetchPositionState } from '../../fetch/doppler/PositionState';

describe('Doppler Pool Deployment', () => {
  let testEnv: Awaited<ReturnType<typeof setupTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  it('should deploy a new Doppler pool', async () => {
    const { sdk, addressProvider, clients } = testEnv;

    if (
      !clients.testClient ||
      !clients.walletClient ||
      !clients.walletClient.chain
    ) {
      throw new Error('Test client not found');
    }

    const { timestamp } = await clients.publicClient.getBlock();
    const configParams: DopplerConfigParams = {
      name: 'Gud Coin',
      symbol: 'GUD',
      totalSupply: parseEther('1000'),
      numTokensToSell: parseEther('1000'),
      blockTimestamp: Number(timestamp),
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
      clients.walletClient.chain.id,
      addressProvider
    );

    const doppler = await deployDoppler(sdk.clients, addressProvider, config);
    expect(doppler.address).toBeDefined();
    expect(doppler.deploymentTx).toBeDefined();

    const slugs = await fetchPositionState(doppler, clients.publicClient);

    expect(slugs[0].liquidity).toEqual(BigInt(0));
    expect(slugs[1].liquidity).toBeGreaterThan(BigInt(0));
    expect(slugs[2].liquidity).toBeGreaterThan(BigInt(0));
  });
});
