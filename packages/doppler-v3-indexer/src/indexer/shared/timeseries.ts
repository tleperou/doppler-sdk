import { Address } from "viem";
import {
  fifteenMinuteBucket,
  fifteenMinuteBucketUsd,
  hourBucket,
  hourBucketUsd,
  thirtyMinuteBucket,
  thirtyMinuteBucketUsd,
  dailyVolume,
} from "ponder.schema";
import { Context } from "ponder:registry";
import {
  secondsInDay,
  secondsIn30Minutes,
  secondsIn15Minutes,
  secondsInHour,
  CHAINLINK_ETH_DECIMALS,
} from "@app/utils/constants";
import { fetchEthPrice } from "./oracle";
import { configs } from "addresses";

interface Checkpoint {
  timestamp: string;
  volumeUsd: string;
  volumeNumeraire: string;
}

export const insertOrUpdateBuckets = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  await insertOrUpdateHourBucket({
    poolAddress,
    price,
    timestamp,
    context,
  });

  await insertOrUpdateHourBucketUsd({
    poolAddress,
    price,
    timestamp,
    context,
  });

  await insertOrUpdateThirtyMinuteBucket({
    poolAddress,
    price,
    timestamp,
    context,
  });

  await insertOrUpdateThirtyMinuteBucketUsd({
    poolAddress,
    price,
    timestamp,
    context,
  });

  await insertOrUpdateFifteenMinuteBucket({
    poolAddress,
    price,
    timestamp,
    context,
  });

  await insertOrUpdateFifteenMinuteBucketUsd({
    poolAddress,
    price,
    timestamp,
    context,
  });
};

const insertOrUpdateThirtyMinuteBucket = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const thirtyMinuteId =
    Math.floor(Number(timestamp) / secondsIn30Minutes) * secondsIn30Minutes;

  try {
    await db
      .insert(thirtyMinuteBucket)
      .values({
        thirtyMinuteId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: price,
        close: price,
        low: price,
        high: price,
        average: price,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: price,
        low: row.low < price ? row.low : price,
        high: row.high > price ? row.high : price,
        average:
          (row.average * BigInt(row.count) + price) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting thirty minute bucket", e);
  }
};

const insertOrUpdateThirtyMinuteBucketUsd = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const thirtyMinuteId =
    Math.floor(Number(timestamp) / secondsIn30Minutes) * secondsIn30Minutes;

  const ethPrice = await fetchEthPrice(timestamp, context);

  if (!ethPrice) {
    console.error("No price found for timestamp", timestamp);
    return;
  }

  const usdPrice = (price * ethPrice.price) / CHAINLINK_ETH_DECIMALS;

  try {
    await db
      .insert(thirtyMinuteBucketUsd)
      .values({
        thirtyMinuteId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: usdPrice,
        close: usdPrice,
        low: usdPrice,
        high: usdPrice,
        average: usdPrice,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: usdPrice,
        low: row.low < usdPrice ? row.low : usdPrice,
        high: row.high > usdPrice ? row.high : usdPrice,
        average:
          (row.average * BigInt(row.count) + usdPrice) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting hour bucket", e);
  }
};

const insertOrUpdateFifteenMinuteBucket = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const fifteenMinuteId =
    Math.floor(Number(timestamp) / secondsIn15Minutes) * secondsIn15Minutes;

  try {
    await db
      .insert(fifteenMinuteBucket)
      .values({
        fifteenMinuteId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: price,
        close: price,
        low: price,
        high: price,
        average: price,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: price,
        low: row.low < price ? row.low : price,
        high: row.high > price ? row.high : price,
        average:
          (row.average * BigInt(row.count) + price) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting hour bucket", e);
  }
};

const insertOrUpdateFifteenMinuteBucketUsd = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const fifteenMinuteId =
    Math.floor(Number(timestamp) / secondsIn15Minutes) * secondsIn15Minutes;

  const ethPrice = await fetchEthPrice(timestamp, context);

  if (!ethPrice) {
    console.error("No price found for timestamp", timestamp);
    return;
  }

  const usdPrice = (price * ethPrice.price) / CHAINLINK_ETH_DECIMALS;

  try {
    await db
      .insert(fifteenMinuteBucketUsd)
      .values({
        fifteenMinuteId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: usdPrice,
        close: usdPrice,
        low: usdPrice,
        high: usdPrice,
        average: usdPrice,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: usdPrice,
        low: row.low < usdPrice ? row.low : usdPrice,
        high: row.high > usdPrice ? row.high : usdPrice,
        average:
          (row.average * BigInt(row.count) + usdPrice) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting hour bucket", e);
  }
};

const insertOrUpdateHourBucket = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const hourId = Math.floor(Number(timestamp) / secondsInHour) * secondsInHour;

  try {
    await db
      .insert(hourBucket)
      .values({
        hourId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: price,
        close: price,
        low: price,
        high: price,
        average: price,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: price,
        low: row.low < price ? row.low : price,
        high: row.high > price ? row.high : price,
        average:
          (row.average * BigInt(row.count) + price) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting hour bucket", e);
  }
};

const insertOrUpdateHourBucketUsd = async ({
  poolAddress,
  price,
  timestamp,
  context,
}: {
  poolAddress: Address;
  price: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;
  const hourId = Math.floor(Number(timestamp) / secondsInHour) * secondsInHour;

  const ethPrice = await fetchEthPrice(timestamp, context);

  if (!ethPrice) {
    console.error("No price found for timestamp", timestamp);
    return;
  }

  const usdPrice = (price * ethPrice.price) / CHAINLINK_ETH_DECIMALS;

  try {
    await db
      .insert(hourBucketUsd)
      .values({
        hourId,
        pool: poolAddress.toLowerCase() as `0x${string}`,
        open: usdPrice,
        close: usdPrice,
        low: usdPrice,
        high: usdPrice,
        average: usdPrice,
        count: 1,
        chainId: BigInt(network.chainId),
      })
      .onConflictDoUpdate((row) => ({
        close: usdPrice,
        low: row.low < usdPrice ? row.low : usdPrice,
        high: row.high > usdPrice ? row.high : usdPrice,
        average:
          (row.average * BigInt(row.count) + usdPrice) / BigInt(row.count + 1),
        count: row.count + 1,
      }));
  } catch (e) {
    console.error("error inserting hour bucket", e);
  }
};

export const insertOrUpdateDailyVolume = async ({
  tokenIn,
  poolAddress,
  amountIn,
  amountOut,
  timestamp,
  context,
}: {
  tokenIn: Address;
  poolAddress: Address;
  amountIn: bigint;
  amountOut: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const { db, network } = context;

  const price = await fetchEthPrice(timestamp, context);

  if (!price) {
    console.error("No price found for timestamp", timestamp);
    return;
  }

  let volumeUsd;
  let volumeNumeraire;
  if (
    tokenIn.toLowerCase() ===
    (configs[network.name].shared.weth.toLowerCase() as `0x${string}`)
  ) {
    volumeUsd = (amountIn * price.price) / CHAINLINK_ETH_DECIMALS;
    volumeNumeraire = amountIn;
  } else {
    volumeUsd = (-amountOut * price.price) / CHAINLINK_ETH_DECIMALS;
    volumeNumeraire = amountOut;
  }

  return await db
    .insert(dailyVolume)
    .values({
      pool: poolAddress.toLowerCase() as `0x${string}`,
      volumeUsd: volumeUsd,
      volumeNumeraire: volumeNumeraire,
      chainId: BigInt(network.chainId),
      lastUpdated: timestamp,
      checkpoints: [
        {
          timestamp: timestamp.toString(),
          volumeUsd: volumeUsd.toString(),
          volumeNumeraire: volumeNumeraire.toString(),
        },
      ],
    })
    .onConflictDoUpdate((row) => {
      const checkpoints: Checkpoint[] = [
        ...(row.checkpoints as Checkpoint[]),
        {
          timestamp: timestamp.toString(),
          volumeUsd: String(volumeUsd),
          volumeNumeraire: String(volumeNumeraire),
        },
      ];
      const updatedCheckpoints = checkpoints.filter(
        (checkpoint) =>
          BigInt(checkpoint.timestamp) >= timestamp - BigInt(secondsInDay)
      );
      const totalVolumeUsd = updatedCheckpoints.reduce(
        (acc, checkpoint) => acc + BigInt(checkpoint.volumeUsd),
        BigInt(0)
      );
      const totalVolumeNumeraire = updatedCheckpoints.reduce(
        (acc, checkpoint) => acc + BigInt(checkpoint.volumeNumeraire),
        BigInt(0)
      );
      return {
        volumeUsd: totalVolumeUsd,
        volumeNumeraire: totalVolumeNumeraire,
        checkpoints: updatedCheckpoints,
        lastUpdated: timestamp,
      };
    });
};
