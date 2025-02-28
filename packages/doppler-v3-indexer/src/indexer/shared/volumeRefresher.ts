import { Address } from "viem";
import { dailyVolume, pool } from "ponder.schema";
import { Context } from "ponder:registry";
import { secondsInDay, secondsInHour } from "@app/utils/constants";
import { and, eq, lt } from "drizzle-orm";
import { updatePool } from "./entities/pool";
import { updateToken } from "./entities/token";
import { updateAsset } from "./entities/asset";
/**
 * Refreshes stale volume data by cleaning up old checkpoints
 * and updating volume metrics even without new swap events
 */
export const refreshStaleVolumeData = async ({
  context,
  currentTimestamp,
}: {
  context: Context;
  currentTimestamp: bigint;
}) => {
  const { db, network } = context;
  const chainId = BigInt(network.chainId);

  // Find pools with stale volume data (last update > 1 hour ago)
  // that belong to the current chain
  const staleThreshold = currentTimestamp - BigInt(secondsInHour);

  // Get stale volume records for this specific chain using sql.select
  let staleVolumeRecords = [];
  try {
    staleVolumeRecords = await db.sql
      .select()
      .from(dailyVolume)
      .where(
        and(
          lt(dailyVolume.lastUpdated, staleThreshold),
          eq(dailyVolume.chainId, chainId)
        )
      )
      .orderBy(dailyVolume.lastUpdated)
      .limit(50); // Process in batches to avoid overloading
  } catch (error) {
    console.error(`Error fetching stale volume records: ${error}`);
    return; // Exit early if query fails
  }

  console.log(
    `Found ${staleVolumeRecords.length} pools with stale volume data on chain ${network.name}`
  );

  for (const staleRecord of staleVolumeRecords) {
    await refreshPoolVolume({
      poolAddress: staleRecord.pool,
      currentTimestamp,
      context,
    });
  }
};

/**
 * Refreshes volume data for a specific pool by:
 * 1. Cleaning up expired checkpoints (older than 24h)
 * 2. Recalculating 24h volume based on remaining checkpoints
 * 3. Updating all related entity volume metrics
 */
export const refreshPoolVolume = async ({
  poolAddress,
  currentTimestamp,
  context,
}: {
  poolAddress: Address;
  currentTimestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;

  // Get volume data for this pool using sql.select
  let volumeData;
  try {
    const volumeResults = await db.sql
      .select()
      .from(dailyVolume)
      .where(eq(dailyVolume.pool, poolAddress.toLowerCase() as `0x${string}`))
      .limit(1);

    volumeData = volumeResults[0];
    if (!volumeData) return;
  } catch (error) {
    console.error(
      `Error fetching volume data for pool ${poolAddress}: ${error}`
    );
    return;
  }

  // Get related pool data to find the asset using sql.select
  let poolData;
  try {
    const poolResults = await db.sql
      .select()
      .from(pool)
      .where(eq(pool.address, poolAddress.toLowerCase() as `0x${string}`))
      .limit(1);

    poolData = poolResults[0];
    if (!poolData) return;
  } catch (error) {
    console.error(`Error fetching pool data for pool ${poolAddress}: ${error}`);
    return;
  }

  // Filter out checkpoints older than 24 hours
  const checkpoints = volumeData.checkpoints as Record<string, string>;
  const cutoffTimestamp = currentTimestamp - BigInt(secondsInDay);

  const updatedCheckpoints = Object.fromEntries(
    Object.entries(checkpoints).filter(([ts]) => BigInt(ts) >= cutoffTimestamp)
  );

  // Recalculate total volume based on remaining checkpoints
  const totalVolumeUsd = Object.values(updatedCheckpoints).reduce(
    (acc, vol) => acc + BigInt(vol),
    BigInt(0)
  );

  // Check if anything has changed before updating
  const checkpointsChanged =
    JSON.stringify(checkpoints) !== JSON.stringify(updatedCheckpoints);
  const volumeChanged = volumeData.volumeUsd !== totalVolumeUsd;

  // Only update if there's an actual change (checkpoints removed or volume changed)
  if (checkpointsChanged || volumeChanged) {
    console.log(
      `Updating volume for pool ${poolAddress} (${volumeData.volumeUsd} → ${totalVolumeUsd})`
    );

    await db
      .update(dailyVolume, {
        pool: poolAddress.toLowerCase() as `0x${string}`,
      })
      .set({
        volumeUsd: totalVolumeUsd,
        checkpoints: updatedCheckpoints,
        lastUpdated: currentTimestamp,
      });
  } else {
    // Just update the lastUpdated timestamp to prevent repeated processing
    await db
      .update(dailyVolume, {
        pool: poolAddress.toLowerCase() as `0x${string}`,
      })
      .set({
        lastUpdated: currentTimestamp,
      });

    // Skip further updates if volume hasn't changed
    return;
  }

  // Only update related entities if the volume actually changed
  // Avoids unnecessary database updates
  if (volumeChanged) {
    // Update related entities with the refreshed volume data
    try {
      await updatePool({
        poolAddress,
        context,
        update: {
          volumeUsd: totalVolumeUsd,
        },
      });
    } catch (error) {
      console.error(`Failed to update pool ${poolAddress}: ${error}`);
      // Continue with other updates rather than failing the whole job
    }

    if (poolData.asset) {
      try {
        await updateAsset({
          assetAddress: poolData.asset,
          context,
          update: {
            dayVolumeUsd: totalVolumeUsd,
          },
        });
      } catch (error) {
        console.error(`Failed to update asset ${poolData.asset}: ${error}`);
      }
    }

    // Update token volumes
    if (poolData.baseToken) {
      try {
        await updateToken({
          tokenAddress: poolData.baseToken,
          context,
          update: {
            volumeUsd: totalVolumeUsd,
          },
        });
      } catch (error) {
        console.error(`Failed to update token ${poolData.baseToken}: ${error}`);
      }
    }
  }
};
