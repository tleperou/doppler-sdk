import { Context } from "ponder:registry";
import { Address } from "viem";
import {
  secondsInHour,
  secondsInDay,
  CHAINLINK_ETH_DECIMALS,
} from "@app/utils/constants";
import { pool, asset, hourBucketUsd } from "ponder.schema";
import { refreshStaleVolumeData } from "./volumeRefresher";
import { and, eq, or, isNull, lt, sql, between } from "drizzle-orm";
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
    await refreshStaleVolumeData({ context, currentTimestamp });
  } catch (error) {
    console.error(`Error in volume refresh job for ${network.name}:`, error);
  }

  // Run metrics refresher job
  try {
    await refreshPoolMetrics({ context, currentTimestamp });
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

  // Exit early if no pools need refreshing
  if (stalePools.length === 0) {
    return;
  }

  const ethPrice = await fetchEthPrice(currentTimestamp, context);
  if (!ethPrice) {
    console.error("Failed to get ETH price, skipping metrics refresh");
    return;
  }

  const BATCH_SIZE = 5;

  for (let i = 0; i < stalePools.length; i += BATCH_SIZE) {
    const batch = stalePools.slice(i, i + BATCH_SIZE);

    // Process this batch in parallel
    await Promise.all(
      batch.map((poolData) =>
        refreshPoolData({
          poolData,
          ethPrice,
          currentTimestamp,
          context,
        }).catch((error) => {
          // Log but don't fail the whole batch
          console.error(`Error refreshing pool ${poolData.address}: ${error}`);
        })
      )
    );

    // Log progress for larger batches
    if (stalePools.length > BATCH_SIZE) {
      console.log(
        `[${network.name}] Processed ${Math.min(i + BATCH_SIZE, stalePools.length)}/${stalePools.length} pools`
      );
    }
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

  // Skip expensive calculations if price is 0
  if (currentPrice === 0n || usdPrice === 0n) {
    return null;
  }

  const searchDelta =
    currentTimestamp - createdAt > BigInt(secondsInDay)
      ? secondsInHour
      : secondsInDay;

  // Use sql.select for better performance
  const hourBucketResults = await db.sql
    .select()
    .from(hourBucketUsd)
    .where(
      and(
        eq(hourBucketUsd.pool, poolAddress.toLowerCase() as `0x${string}`),
        between(
          hourBucketUsd.hourId,
          Number(timestampFrom) - searchDelta,
          Number(timestampFrom) + searchDelta
        )
      )
    )
    .orderBy(hourBucketUsd.hourId)
    .limit(1);

  const priceFrom = hourBucketResults[0];
  if (!priceFrom || priceFrom.open === 0n) {
    return null;
  }

  const priceChangePercent =
    (Number(usdPrice - priceFrom.open) / Number(priceFrom.open)) * 100;

  // Skip tiny price changes (< 0.1%)
  if (Math.abs(priceChangePercent) < 0.1) {
    return null;
  }

  // Get both asset and pool in parallel to save time
  const [currentAsset, currentPool] = await Promise.all([
    db.find(asset, { address: assetAddress }),
    db.find(pool, {
      address: poolAddress,
      chainId: BigInt(network.chainId),
    }),
  ]);

  // Prepare updates
  const updates = [];

  // Only update asset if needed
  if (
    !currentAsset ||
    Math.abs(currentAsset.percentDayChange - priceChangePercent) > 0.1
  ) {
    updates.push(
      updateAsset({
        assetAddress,
        context,
        update: {
          percentDayChange: priceChangePercent,
        },
      })
    );
  }

  // Only update pool if needed
  if (
    !currentPool ||
    Math.abs(currentPool.percentDayChange - priceChangePercent) > 0.1
  ) {
    updates.push(
      updatePool({
        poolAddress,
        context,
        update: {
          percentDayChange: priceChangePercent,
        },
      })
    );
  }

  // Execute updates in parallel if there are any
  if (updates.length > 0) {
    await Promise.all(updates);
  }
};

/**
 * Updates the market cap for an asset
 */
// Cache for total supply values to avoid repeated contract calls
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
  // Skip immediately if price is 0
  if (price === 0n) {
    return;
  }

  const { client, db } = context;

  try {
    // Get total supply (from cache if available)
    let totalSupply: bigint | null = null;
    // Read from contract
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
        return null;
      });

    if (totalSupplyResult) {
      totalSupply = totalSupplyResult as bigint;
    }

    if (totalSupply) {
      const marketCap = (price * totalSupply) / BigInt(10 ** 18);
      const marketCapUsd = (marketCap * ethPrice) / CHAINLINK_ETH_DECIMALS;

      // Get current asset value
      const currentAsset = await db.find(asset, { address: assetAddress });
      if (!currentAsset) return;

      await updateAsset({
        assetAddress,
        context,
        update: {
          marketCapUsd,
        },
      });
    }
  } catch (error) {
    // Less verbose error handling
    console.error(
      `Market cap update failed for ${assetAddress.slice(0, 8)}...`
    );
  }
};
