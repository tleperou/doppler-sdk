import { ponder } from "ponder:registry";
import { computeV3Price, getV3PoolData } from "@app/utils/v3-utils";
import { asset, position, pool, ethPrice } from "ponder.schema";
import { getAssetData } from "@app/utils/getAssetData";
import {
  insertOrUpdateHourBucket,
  insertTokenIfNotExists,
  insertOrUpdateDailyVolume,
} from "./indexer-shared";
import { UniswapV3PoolABI } from "@app/abis";
import { addresses } from "@app/types/addresses";

ponder.on("UniswapV3Initializer:Create", async ({ event, context }) => {
  const { network } = context;
  const { poolOrHook, asset: assetId, numeraire } = event.args;

  const assetData = await getAssetData(assetId, context);

  if (!assetData) {
    console.error("UniswapV3Initializer:Create - Asset data not found");
    return;
  }

  const { slot0Data, liquidity, price, fee } = await getV3PoolData({
    address: poolOrHook,
    context,
  });

  await insertTokenIfNotExists({
    address: numeraire,
    timestamp: event.block.timestamp,
    context,
    isDerc20: false,
  });

  await context.db
    .insert(pool)
    .values({
      ...slot0Data,
      address: poolOrHook,
      liquidity: liquidity,
      createdAt: event.block.timestamp,
      asset: assetId,
      baseToken: assetId,
      quoteToken: numeraire,
      price,
      type: "v3",
      chainId: BigInt(network.chainId),
      fee,
    })
    .onConflictDoNothing();

  await context.db
    .insert(asset)
    .values({
      ...assetData,
      address: assetId,
      createdAt: event.block.timestamp,
      migratedAt: null,
      chainId: BigInt(network.chainId),
    })
    .onConflictDoNothing();
});

ponder.on("UniswapV3Pool:Mint", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { tickLower, tickUpper, amount, owner } = event.args;

  const { slot0Data, liquidity, poolState, price, fee } = await getV3PoolData({
    address,
    context,
  });

  await db
    .insert(pool)
    .values({
      ...slot0Data,
      address,
      liquidity,
      createdAt: event.block.timestamp,
      asset: poolState.asset,
      baseToken: poolState.asset,
      quoteToken: poolState.numeraire,
      price,
      type: "v3",
      chainId: BigInt(network.chainId),
      fee,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity + amount,
    }));

  await db
    .insert(position)
    .values({
      owner: owner,
      pool: address,
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidity: amount,
      createdAt: event.block.timestamp,
      chainId: BigInt(network.chainId),
    })
    .onConflictDoUpdate((row) => ({ liquidity: row.liquidity + amount }));
});

ponder.on("UniswapV3Pool:Burn", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { tickLower, tickUpper, owner, amount } = event.args;

  const { slot0Data, liquidity, poolState, price, fee } = await getV3PoolData({
    address,
    context,
  });

  await db
    .insert(pool)
    .values({
      ...slot0Data,
      address,
      liquidity,
      createdAt: event.block.timestamp,
      asset: poolState.asset,
      baseToken: poolState.asset,
      quoteToken: poolState.numeraire,
      price,
      type: "v3",
      chainId: BigInt(network.chainId),
      fee,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity - amount,
    }));

  await db
    .insert(position)
    .values({
      owner: owner,
      pool: address,
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidity: amount,
      createdAt: event.block.timestamp,
      chainId: BigInt(network.chainId),
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity - amount,
    }));
});

ponder.on("UniswapV3Pool:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { amount0, amount1 } = event.args;

  const { slot0Data, liquidity, poolState, price, fee, token0, token1 } = await getV3PoolData({
    address,
    context,
  });

  let amountIn;
  let amountOut;
  let tokenIn;
  if (amount0 > 0n) {
    amountIn = amount0;
    amountOut = amount1;
    tokenIn = token0;
  } else {
    amountIn = amount1;
    amountOut = amount0;
    tokenIn = token1;
  }

  await insertOrUpdateHourBucket({
    poolAddress: address,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateDailyVolume({
    poolAddress: address,
    amountIn,
    amountOut,
    timestamp: event.block.timestamp,
    context,
    tokenIn,
  });

  await db
    .insert(pool)
    .values({
      address,
      ...slot0Data,
      liquidity: liquidity,
      createdAt: event.block.timestamp,
      baseToken: poolState.asset,
      quoteToken: poolState.numeraire,
      price: price,
      asset: poolState.asset,
      type: "v3",
      chainId: BigInt(network.chainId),
      fee,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: liquidity,
      price: price,
      ...slot0Data,
    }));
});
