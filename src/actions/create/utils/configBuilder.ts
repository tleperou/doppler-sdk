import { Price, Token } from '@uniswap/sdk-core';
import { priceToClosestTick, Pool, PoolKey } from '@uniswap/v4-sdk';
import { MineParams, mine } from './airlockMiner';
import { DopplerAddresses } from '../../../types';
import { parseEther } from 'viem';
import {
  DopplerPreDeploymentConfig,
  DopplerDeploymentConfig,
  DAY_SECONDS,
  DEFAULT_PD_SLUGS,
  MAX_TICK_SPACING,
  PriceRange,
} from '../../../entities/Deployer';

/**
 * Validates and builds pool configuration from user-friendly parameters
 */
export function buildConfig(
  params: DopplerPreDeploymentConfig,
  chainId: number,
  addresses: DopplerAddresses
): DopplerDeploymentConfig {
  validateBasicParams(params);

  const { startTick, endTick } = computeTicks(
    params.priceRange,
    params.tickSpacing
  );

  const gamma = computeOptimalGamma(
    startTick,
    endTick,
    params.duration,
    params.epochLength,
    params.tickSpacing
  );

  const startTime =
    params.blockTimestamp + params.startTimeOffset * DAY_SECONDS;
  const endTime = params.blockTimestamp + params.duration * DAY_SECONDS;

  const totalDuration = endTime - startTime;
  if (totalDuration % params.epochLength !== 0) {
    throw new Error('Epoch length must divide total duration evenly');
  }

  if (gamma % params.tickSpacing !== 0) {
    throw new Error('Computed gamma must be divisible by tick spacing');
  }

  const { tokenFactory, dopplerFactory, poolManager, airlock } = addresses;

  const mineParams: MineParams = {
    poolManager,
    numTokensToSell: params.numTokensToSell,
    minTick: startTick,
    maxTick: endTick,
    airlock,
    name: params.name,
    symbol: params.symbol,
    initialSupply: params.totalSupply,
    numeraire: '0x0000000000000000000000000000000000000000',
    startingTime: BigInt(startTime),
    endingTime: BigInt(endTime),
    minimumProceeds: params.minProceeds,
    maximumProceeds: params.maxProceeds,
    epochLength: BigInt(params.epochLength),
    gamma,
    numPDSlugs: BigInt(params.numPdSlugs ?? DEFAULT_PD_SLUGS),
  };

  const [salt, dopplerAddress, tokenAddress] = mine(
    tokenFactory,
    dopplerFactory,
    mineParams
  );

  const token = new Token(
    chainId,
    tokenAddress,
    18,
    params.name,
    params.symbol
  );

  const eth = new Token(
    chainId,
    '0x0000000000000000000000000000000000000000',
    18,
    'ETH',
    'Ether'
  );

  const poolKey: PoolKey = Pool.getPoolKey(
    token,
    eth,
    params.fee,
    params.tickSpacing,
    dopplerAddress
  );

  return {
    salt,
    poolKey,
    dopplerAddress,
    token: {
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
    },
    hook: {
      assetToken: token,
      quoteToken: eth,
      startTime: startTime,
      endTime: endTime,
      epochLength: params.epochLength,
      startTick,
      endTick,
      gamma,
      maxProceeds: params.maxProceeds,
      minProceeds: params.minProceeds,
      numTokensToSell: params.numTokensToSell,
      numPdSlugs: params.numPdSlugs ?? DEFAULT_PD_SLUGS,
    },
    pool: {
      tickSpacing: params.tickSpacing,
      fee: params.fee,
    },
  };
}

// Converts price range to tick range, ensuring alignment with tick spacing
function computeTicks(
  priceRange: PriceRange,
  tickSpacing: number
): { startTick: number; endTick: number } {
  const quoteToken = new Token(
    1,
    '0x0000000000000000000000000000000000000000',
    18
  );
  const assetToken = new Token(
    1,
    '0x0000000000000000000000000000000000000001',
    18
  );
  // Convert prices to sqrt price X96
  let startTick = priceToClosestTick(
    new Price(
      assetToken,
      quoteToken,
      parseEther('1').toString(),
      parseEther(priceRange.startPrice.toString()).toString()
    )
  );
  let endTick = priceToClosestTick(
    new Price(
      assetToken,
      quoteToken,
      parseEther('1').toString(),
      parseEther(priceRange.endPrice.toString()).toString()
    )
  );

  // Align to tick spacing
  startTick = Math.floor(startTick / tickSpacing) * tickSpacing;
  endTick = Math.floor(endTick / tickSpacing) * tickSpacing;

  // Validate tick range
  if (startTick === endTick) {
    throw new Error('Start and end prices must result in different ticks');
  }

  return { startTick, endTick };
}

// Computes optimal gamma parameter based on price range and time parameters
function computeOptimalGamma(
  startTick: number,
  endTick: number,
  durationDays: number,
  epochLength: number,
  tickSpacing: number
): number {
  // Calculate total number of epochs
  const totalEpochs = (durationDays * DAY_SECONDS) / epochLength;

  // Calculate required tick movement per epoch to cover the range
  const tickDelta = Math.abs(endTick - startTick);
  // Round up to nearest multiple of tick spacing
  let gamma = Math.ceil(tickDelta / totalEpochs) * tickSpacing;
  // Ensure gamma is at least 1 tick spacing
  gamma = Math.max(tickSpacing, gamma);

  if (gamma % tickSpacing !== 0) {
    throw new Error('Computed gamma must be divisible by tick spacing');
  }

  return gamma;
}

// Validates basic parameters
function validateBasicParams(params: DopplerPreDeploymentConfig) {
  // Validate tick spacing
  if (params.tickSpacing > MAX_TICK_SPACING) {
    throw new Error(`Tick spacing cannot exceed ${MAX_TICK_SPACING}`);
  }

  // Validate time parameters
  if (params.startTimeOffset < 0) {
    throw new Error('Start time offset must be positive');
  }
  if (params.duration <= 0) {
    throw new Error('Duration must be positive');
  }
  if (params.epochLength <= 0) {
    throw new Error('Epoch length must be positive');
  }

  // Validate proceeds
  if (params.maxProceeds < params.minProceeds) {
    throw new Error('Maximum proceeds must be greater than minimum proceeds');
  }

  // Validate price range
  if (params.priceRange.startPrice === 0 || params.priceRange.endPrice === 0) {
    throw new Error('Prices must be positive');
  }
  if (params.priceRange.startPrice === params.priceRange.endPrice) {
    throw new Error('Start and end prices must be different');
  }
}

// // Helper to suggest optimal epoch length based on duration
// function suggestEpochLength(durationDays: number): number {
//   if (durationDays > 30) return 2 * 60 * 60; // 2 hours
//   if (durationDays > 7) return 1 * 60 * 60; // 1 hour
//   if (durationDays > 1) return 1 * 60 * 30; // 30 minutes
//   return 1 * 60 * 20; // 20 minutes
// }
