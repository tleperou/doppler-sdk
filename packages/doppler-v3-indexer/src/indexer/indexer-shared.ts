import { Context, ponder } from "ponder:registry";
import { Address, zeroAddress } from "viem";
import { DERC20ABI } from "../abis";
import { secondsInHour } from "@app/utils/constants";
import { token, hourBucket, asset, userAsset, user } from "ponder.schema";
import { getAssetData } from "@app/utils/getAssetData";

export const insertOrUpdateHourBucket = async ({
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
  const hourId = Math.floor(Number(timestamp) / secondsInHour) * secondsInHour;

  try {
    await context.db
      .insert(hourBucket)
      .values({
        id: `${poolAddress}-${hourId.toString()}`,
        open: price,
        close: price,
        low: price,
        high: price,
        average: price,
        count: 1,
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

export const insertTokenIfNotExists = async ({
  address,
  chainId,
  timestamp,
  context,
  isDerc20 = false,
}: {
  address: Address;
  chainId: bigint;
  timestamp: bigint;
  context: Context;
  isDerc20?: boolean;
}) => {
  const existingToken = await context.db.find(token, {
    address,
  });

  if (existingToken) return existingToken;

  if (address === zeroAddress) {
    return await context.db.insert(token).values({
      address,
      chainId,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      firstSeenAt: timestamp,
      totalSupply: 0n,
      isDerc20: false,
    });
  } else {
    const [nameResult, symbolResult, decimalsResult, totalSupplyResult] =
      await context.client.multicall({
        contracts: [
          {
            abi: DERC20ABI,
            address,
            functionName: "name",
          },
          {
            abi: DERC20ABI,
            address,
            functionName: "symbol",
          },
          {
            abi: DERC20ABI,
            address,
            functionName: "decimals",
          },
          {
            abi: DERC20ABI,
            address,
            functionName: "totalSupply",
          },
        ],
      });

    return await context.db
      .insert(token)
      .values({
        address,
        chainId,
        name: nameResult?.result ?? `Unknown Token (${address})`,
        symbol: symbolResult?.result ?? "???",
        decimals: decimalsResult.result ?? 18,
        totalSupply: totalSupplyResult.result ?? 0n,
        firstSeenAt: timestamp,
        isDerc20,
      })
      .onConflictDoNothing();
  }
};

ponder.on("Airlock:Migrate", async ({ event, context }) => {
  const { db } = context;
  const { asset: assetId } = event.args;

  const assetData = await getAssetData(assetId, context);

  if (!assetData) {
    console.error("Airlock:Migrate - Asset data not found");
    return;
  }

  await db
    .insert(asset)
    .values({
      ...assetData,
      address: assetId,
      createdAt: event.block.timestamp,
      migratedAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      migratedAt: event.block.timestamp,
    }));
});

ponder.on("DERC20:Transfer", async ({ event, context }) => {
  const { db, network } = context;
  const { address } = event.log;
  const { from, to, value } = event.args;

  await insertTokenIfNotExists({
    address,
    chainId: BigInt(network.chainId),
    timestamp: event.block.timestamp,
    context,
    isDerc20: true,
  });

  await db
    .insert(user)
    .values({
      id: to,
      address: to,
      createdAt: event.block.timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(user)
    .values({
      id: from,
      address: from,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      createdAt: event.block.timestamp,
    }));

  await db
    .insert(userAsset)
    .values({
      userId: to,
      assetId: address,
      balance: value,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      balance: row.balance + value,
    }));

  await db
    .insert(userAsset)
    .values({
      userId: from,
      assetId: address,
      balance: -value,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      balance: row.balance - value,
    }));
});

