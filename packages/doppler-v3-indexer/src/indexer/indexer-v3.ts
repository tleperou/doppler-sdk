import { ponder } from "ponder:registry";
import { getV3PoolData } from "@app/utils/v3-utils";
import { asset, position, pool, poolConfig } from "ponder.schema";
import { getAssetData } from "@app/utils/getAssetData";
import {
  insertOrUpdateHourBucket,
  insertOrUpdateHourBucketUsd,
  insertTokenIfNotExists,
  insertOrUpdateDailyVolume,
  computeDollarLiquidity,
} from "./indexer-shared";
import {
  computeGraduationThresholdDelta,
  insertPoolConfigIfNotExists,
} from "@app/utils/v3-utils/computeGraduationThreshold";

ponder.on("UniswapV3Initializer:Create", async ({ event, context }) => {
  const { network } = context;
  const { poolOrHook, asset: assetId, numeraire } = event.args;

  const assetData = await getAssetData(assetId, context);

  if (!assetData) {
    console.error("UniswapV3Initializer:Create - Asset data not found");
    return;
  }

  const {
    slot0Data,
    liquidity,
    price,
    fee,
    token0Balance,
    token1Balance,
    token0,
    poolState,
  } = await getV3PoolData({
    address: poolOrHook,
    context,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    token0Balance,
    token1Balance,
    poolState,
    token0,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertTokenIfNotExists({
    address: numeraire,
    timestamp: event.block.timestamp,
    context,
    isDerc20: false,
  });

  await insertTokenIfNotExists({
    address: assetId,
    timestamp: event.block.timestamp,
    context,
    isDerc20: true,
    poolAddress: poolOrHook,
  });

  await insertPoolConfigIfNotExists({
    poolAddress: poolOrHook,
    context,
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
      dollarLiquidity,
      dailyVolume: poolOrHook,
      graduationThreshold: 0n,
      graduationBalance: 0n,
      totalFee0: 0n,
      totalFee1: 0n,
    })
    .onConflictDoNothing();

  await context.db
    .insert(asset)
    .values({
      ...assetData,
      address: assetId.toLowerCase() as `0x${string}`,
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

  const {
    slot0Data,
    liquidity,
    price,
    fee,
    token0Balance,
    token1Balance,
    token0,
    token1,
    poolState,
  } = await getV3PoolData({
    address,
    context,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    token0Balance,
    token1Balance,
    poolState,
    token0,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  const graduationThresholdDelta = await computeGraduationThresholdDelta({
    poolAddress: address,
    context,
    tickLower,
    tickUpper,
    liquidity: amount,
    isToken0: token0.toLowerCase() === poolState.asset.toLowerCase(),
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
      dollarLiquidity,
      dailyVolume: address,
      graduationThreshold: graduationThresholdDelta,
      graduationBalance: 0n,
      totalFee0: 0n,
      totalFee1: 0n,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity + amount,
      dollarLiquidity: dollarLiquidity,
      graduationThreshold: row.graduationThreshold + graduationThresholdDelta,
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
      liquidity: row.liquidity + amount,
      dollarLiquidity: dollarLiquidity,
    }));
});

ponder.on("UniswapV3Pool:Burn", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { tickLower, tickUpper, owner, amount } = event.args;

  const {
    slot0Data,
    liquidity,
    price,
    fee,
    token0Balance,
    token1Balance,
    token0,
    token1,
    poolState,
  } = await getV3PoolData({
    address,
    context,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    token0Balance,
    token1Balance,
    poolState,
    token0,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  const graduationThresholdDelta = await computeGraduationThresholdDelta({
    poolAddress: address,
    context,
    tickLower,
    tickUpper,
    liquidity,
    isToken0: token0.toLowerCase() === poolState.asset.toLowerCase(),
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
      dollarLiquidity,
      dailyVolume: address,
      graduationThreshold: -graduationThresholdDelta,
      graduationBalance: 0n,
      totalFee0: 0n,
      totalFee1: 0n,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity - amount,
      dollarLiquidity: dollarLiquidity,
      graduationThreshold: row.graduationThreshold - graduationThresholdDelta,
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
      dollarLiquidity: dollarLiquidity,
    }));
});

ponder.on("UniswapV3Pool:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { amount0, amount1 } = event.args;

  const {
    slot0Data,
    liquidity,
    price,
    fee,
    token0Balance,
    token1Balance,
    token0,
    token1,
    poolState,
  } = await getV3PoolData({
    address,
    context,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    token0Balance,
    token1Balance,
    poolState,
    token0,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  const isToken0 = token0.toLowerCase() === poolState.asset.toLowerCase();

  let amountIn;
  let amountOut;
  let tokenIn;
  let fee0;
  let fee1;
  if (amount0 > 0n) {
    amountIn = amount0;
    amountOut = amount1;
    tokenIn = token0;
    fee0 = (amountIn * BigInt(fee)) / BigInt(1_000_000);
    fee1 = 0n;
  } else {
    amountIn = amount1;
    amountOut = amount0;
    tokenIn = token1;
    fee1 = (amountIn * BigInt(fee)) / BigInt(1_000_000);
    fee0 = 0n;
  }

  const quoteDelta = isToken0 ? amount1 - fee1 : amount0 - fee0;

  await insertOrUpdateHourBucket({
    poolAddress: address,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateHourBucketUsd({
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
      dollarLiquidity,
      dailyVolume: address,
      graduationThreshold: 0n,
      graduationBalance: quoteDelta,
      totalFee0: fee0,
      totalFee1: fee1,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: liquidity,
      price: price,
      dollarLiquidity: dollarLiquidity,
      totalFee0: row.totalFee0 + fee0,
      totalFee1: row.totalFee1 + fee1,
      graduationBalance: row.graduationBalance + quoteDelta,
      ...slot0Data,
    }));
});
