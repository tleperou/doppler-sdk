import { Context } from "ponder:registry";
import { Address } from "viem";
import {
  secondsInHour,
  secondsInDay,
  CHAINLINK_ETH_DECIMALS,
} from "@app/utils/constants";
import { pool, asset } from "ponder.schema";
import { refreshStaleVolumeData } from "./volumeRefresher";
import { and, eq, or, isNull, lt, sql } from "drizzle-orm";
import { updatePool } from "./entities/pool";
import { updateAsset } from "./entities/asset";
import { fetchEthPrice } from "./oracle";
import { computeDollarLiquidity } from "@app/utils/computeDollarLiquidity";

/**
 * Executes all refresh jobs on each block handler trigger
 * This runs both volume and metrics refreshes each time it's called
 */
export const executeScheduledJobs = async ({
  context,
  currentTimestamp,
}: {
  context: Context;
  currentTimestamp: bigint;
}) => {
  const { network } = context;

  // Run volume refresher job
  try {
    console.log(
      `[${network.name} (${network.chainId})] Volume refresh job starting...`
    );
    await refreshStaleVolumeData({ context, currentTimestamp });
    console.log(`[${network.name}] Volume refresh job completed`);
  } catch (error) {
    console.error(`Error in volume refresh job for ${network.name}:`, error);
  }

  // Run metrics refresher job
  try {
    console.log(
      `[${network.name} (${network.chainId})] Metrics refresh job starting...`
    );
    await refreshPoolMetrics({ context, currentTimestamp });
    console.log(`[${network.name}] Metrics refresh job completed`);
  } catch (error) {
    console.error(`Error in metrics refresh job for ${network.name}:`, error);
  }
};

/**
 * Refreshes pool and asset metrics that should be periodically updated:
 * - percentDayChange
 * - dollarLiquidity (pools)
 * - liquidityUsd (assets)
 * - marketCapUsd (assets)
 */
export const refreshPoolMetrics = async ({
  context,
  currentTimestamp,
}: {
  context: Context;
  currentTimestamp: bigint;
}) => {
  const { db, network } = context;
  const chainId = BigInt(network.chainId);

  // Find pools that haven't been refreshed in the last hour
  const staleThreshold = currentTimestamp - BigInt(secondsInHour * 2);

  // Use db.sql.select with Drizzle helpers
  let stalePools = [];
  try {
    stalePools = await db.sql
      .select()
      .from(pool)
      .where(
        and(
          eq(pool.chainId, chainId),
          or(isNull(pool.lastRefreshed), lt(pool.lastRefreshed, staleThreshold))
        )
      )
      .orderBy(sql`COALESCE(${pool.lastRefreshed}, ${pool.createdAt})`)
      .limit(20);
  } catch (error) {
    console.error(`Error fetching stale pools: ${error}`);
    return; // Exit early if the query fails
  }

  console.log(
    `Found ${stalePools.length} pools with stale metrics on chain ${network.name}`
  );

  // Current eth price for all calculations
  const ethPrice = await fetchEthPrice(currentTimestamp, context);
  if (!ethPrice) {
    console.error("Failed to get ETH price, skipping metrics refresh");
    return;
  }

  for (const poolData of stalePools) {
    await refreshPoolData({
      poolData,
      ethPrice,
      currentTimestamp,
      context,
    });
  }
};

/**
 * Refreshes data for a specific pool including:
 * - Price change percentage (24h)
 * - Dollar liquidity amounts
 */
export const refreshPoolData = async ({
  poolData,
  ethPrice,
  currentTimestamp,
  context,
}: {
  poolData: typeof pool.$inferSelect;
  ethPrice: bigint;
  currentTimestamp: bigint;
  context: Context;
}) => {
  const { db } = context;
  const poolAddress = poolData.address as Address;
  const assetAddress = poolData.asset as Address;

  try {
    // 1. Update price change percentage
    await refreshPriceChangePercent({
      poolAddress,
      assetAddress,
      currentPrice: poolData.price,
      currentTimestamp,
      ethPrice,
      createdAt: poolData.createdAt,
      context,
    });

    // 2. Update dollar liquidity for pool
    // We're using the stored reserves for calculation
    const dollarLiquidity = await computeDollarLiquidity({
      assetBalance: poolData.isToken0 ? poolData.reserves0 : poolData.reserves1,
      quoteBalance: poolData.isToken0 ? poolData.reserves1 : poolData.reserves0,
      price: poolData.price,
      ethPrice,
    });

    // Only update if the value has changed significantly (>1%)
    let shouldUpdateLiquidity = false;
    if (poolData.dollarLiquidity === 0n) {
      shouldUpdateLiquidity = dollarLiquidity > 0n;
    } else if (dollarLiquidity === 0n) {
      shouldUpdateLiquidity = true;
    } else {
      const percentChange =
        Math.abs(
          Number(dollarLiquidity - poolData.dollarLiquidity) /
            Number(poolData.dollarLiquidity)
        ) * 100;
      shouldUpdateLiquidity = percentChange > 1;
    }

    if (shouldUpdateLiquidity) {
      await updatePool({
        poolAddress,
        context,
        update: {
          dollarLiquidity: dollarLiquidity ?? 0n,
          lastRefreshed: currentTimestamp,
        },
      });

      // 3. Update liquidityUsd for the asset
      await updateAsset({
        assetAddress,
        context,
        update: {
          liquidityUsd: dollarLiquidity ?? 0n,
        },
      });
    } else {
      // Just update the last refreshed timestamp
      await updatePool({
        poolAddress,
        context,
        update: {
          lastRefreshed: currentTimestamp,
        },
      });
    }

    // 4. Update market cap for the asset if needed
    await refreshAssetMarketCap({
      assetAddress,
      price: poolData.price,
      ethPrice,
      context,
    });
  } catch (error) {
    console.error(`Failed to refresh metrics for pool ${poolAddress}:`, error);
  }
};

/**
 * Calculates and updates the 24-hour price change percentage
 */
export const refreshPriceChangePercent = async ({
  poolAddress,
  assetAddress,
  currentPrice,
  currentTimestamp,
  ethPrice,
  createdAt,
  context,
}: {
  poolAddress: Address;
  assetAddress: Address;
  currentPrice: bigint;
  currentTimestamp: bigint;
  ethPrice: bigint;
  createdAt: bigint;
  context: Context;
}) => {
  const { db, network } = context;

  const timestampFrom = currentTimestamp - BigInt(secondsInDay);
  const usdPrice = (currentPrice * ethPrice) / CHAINLINK_ETH_DECIMALS;
  const searchDelta =
    currentTimestamp - createdAt > BigInt(secondsInDay)
      ? secondsInHour
      : secondsInDay;

  const priceFrom = await db.sql.query.hourBucketUsd.findFirst({
    where: (fields, { and, eq, between }) =>
      and(
        eq(fields.pool, poolAddress.toLowerCase() as `0x${string}`),
        between(
          fields.hourId,
          Number(timestampFrom) - searchDelta,
          Number(timestampFrom) + searchDelta
        )
      ),
    orderBy: (fields, { asc }) => [asc(fields.hourId)],
  });

  if (!priceFrom || priceFrom.open === 0n) {
    return null;
  }

  const priceChangePercent =
    (Number(usdPrice - priceFrom.open) / Number(priceFrom.open)) * 100;

  // Only update if there's a significant change (avoid tiny updates)
  const currentAsset = await db.find(asset, { address: assetAddress });
  if (
    !currentAsset ||
    Math.abs(currentAsset.percentDayChange - priceChangePercent) > 0.1
  ) {
    await updateAsset({
      assetAddress,
      context,
      update: {
        percentDayChange: priceChangePercent,
      },
    });
  }

  // Update pool's percent day change
  const currentPool = await db.find(pool, {
    address: poolAddress,
    chainId: BigInt(network.chainId),
  });
  if (
    !currentPool ||
    Math.abs(currentPool.percentDayChange - priceChangePercent) > 0.1
  ) {
    await updatePool({
      poolAddress,
      context,
      update: {
        percentDayChange: priceChangePercent,
      },
    });
  }
};

/**
 * Updates the market cap for an asset
 */
export const refreshAssetMarketCap = async ({
  assetAddress,
  price,
  ethPrice,
  context,
}: {
  assetAddress: Address;
  price: bigint;
  ethPrice: bigint;
  context: Context;
}) => {
  const { client, db } = context;

  try {
    // Try to read totalSupply from the asset token
    const totalSupplyResult = await client
      .readContract({
        address: assetAddress,
        abi: [
          {
            name: "totalSupply",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: "uint256" }],
          },
        ],
        functionName: "totalSupply",
      })
      .catch((err) => {
        console.warn(`Failed to read totalSupply for ${assetAddress}:`, err);
        return null;
      });

    if (totalSupplyResult) {
      const totalSupply = totalSupplyResult as bigint;
      const marketCap = (price * totalSupply) / BigInt(10 ** 18);
      const marketCapUsd = (marketCap * ethPrice) / CHAINLINK_ETH_DECIMALS;

      // Get current value to avoid unnecessary updates
      const currentAsset = await db.find(asset, { address: assetAddress });

      // Only update if change is significant (>1%)
      let shouldUpdate = false;
      if (!currentAsset || currentAsset.marketCapUsd === 0n) {
        shouldUpdate = marketCapUsd > 0n;
      } else if (marketCapUsd === 0n) {
        shouldUpdate = true;
      } else {
        const percentChange =
          Math.abs(
            Number(marketCapUsd - currentAsset.marketCapUsd) /
              Number(currentAsset.marketCapUsd)
          ) * 100;
        shouldUpdate = percentChange > 1;
      }

      if (shouldUpdate) {
        await updateAsset({
          assetAddress,
          context,
          update: {
            marketCapUsd,
          },
        });
      }
    }
  } catch (error) {
    console.error(
      `Failed to update market cap for asset ${assetAddress}:`,
      error
    );
  }
};
