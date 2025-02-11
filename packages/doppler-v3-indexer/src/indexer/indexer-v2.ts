import { ponder } from "ponder:registry";
import { getV3PoolData } from "@app/utils/v3-utils";
import { asset, position, pool, poolConfig } from "ponder.schema";
import {
  insertOrUpdateHourBucket,
  insertOrUpdateHourBucketUsd,
  insertOrUpdateDailyVolume,
  computeDollarLiquidity,
} from "./indexer-shared";
import { computeV2Price } from "@app/utils/v2-utils/computeV2Price";
import { getAssetData } from "@app/utils/getAssetData";
import { getPairData } from "@app/utils/v2-utils/getPairData";
import { configs } from "../../addresses";

ponder.on("UniswapV2Pair:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { amount0In, amount1In, amount0Out, amount1Out } = event.args;

  const { token0, token1, totalSupply, token0Balance, token1Balance } =
    await getPairData({
      address,
      context,
    });

  const assetAddr =
    token0?.toLowerCase() === configs[network.name].shared.weth.toLowerCase()
      ? token1
      : token0;

  const quoteAddr =
    token0?.toLowerCase() === configs[network.name].shared.weth.toLowerCase()
      ? token0
      : token1;

  const tokenIn = amount0In > 0n ? token0 : token1;

  if (
    !assetAddr ||
    !quoteAddr ||
    !tokenIn ||
    !token0Balance ||
    !token1Balance
  ) {
    return;
  }

  const { pool: poolAddr } = await getAssetData(assetAddr, context);

  const price = await computeV2Price({
    reserve0: token0Balance,
    reserve1: token1Balance,
    baseToken: assetAddr,
    quoteToken: quoteAddr,
    context,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    assetBalance: token0Balance,
    quoteBalance: token1Balance,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateHourBucket({
    poolAddress: poolAddr,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateHourBucketUsd({
    poolAddress: poolAddr,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateDailyVolume({
    poolAddress: poolAddr,
    amountIn: amount0In,
    amountOut: amount0Out,
    timestamp: event.block.timestamp,
    context,
    tokenIn,
  });

  await db
    .update(pool, {
      address: poolAddr,
      chainId: BigInt(network.chainId),
      baseToken: assetAddr,
      quoteToken: quoteAddr,
    })
    .set({
      price,
      dollarLiquidity,
    });
});

// ponder.on("UniswapV2Pair:Mint", async ({ event, context }) => {
//   const { db, network } = context;
//   const address = event.log.address;
//   const { amount0, amount1 } = event.args;

// }
