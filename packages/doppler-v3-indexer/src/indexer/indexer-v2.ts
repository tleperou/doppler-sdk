import { ponder } from "ponder:registry";
import { asset, pool } from "ponder.schema";
import {
  insertOrUpdateBuckets,
  insertOrUpdateDailyVolume,
} from "./shared/timeseries";
import { computeV2Price } from "@app/utils/v2-utils/computeV2Price";
import { getPairData } from "@app/utils/v2-utils/getPairData";
import { computeDollarLiquidity } from "@app/utils/computeDollarLiquidity";

ponder.on("UniswapV2Pair:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { amount0In, amount1In, amount0Out, amount1Out } = event.args;

  const { token0, token1, reserve0, reserve1 } = await getPairData({
    address,
    context,
  });

  if (!token0 || !token1 || !reserve0 || !reserve1) {
    console.error(
      "UniswapV2Pair:Swap - Token0 or token1 or reserve0 or reserve1 not found"
    );
    return;
  }
  let assetData;

  assetData = await db.find(asset, {
    address: token0,
  });

  if (!assetData) {
    assetData = await db.find(asset, {
      address: token1,
    });
  }

  if (!assetData) {
    console.error("UniswapV2Pair:Swap - Asset data not found");
    return;
  }

  const amountIn = amount0In > 0n ? amount0In : amount1In;
  const amountOut = amount0Out > 0n ? amount0Out : amount1Out;

  const isToken0 = assetData.address.toLowerCase() === token0.toLowerCase();
  const quoteAddr = assetData.numeraire.toLowerCase();
  const assetAddr = assetData.address.toLowerCase();
  const poolAddress = assetData.poolAddress;

  const tokenIn = isToken0 ? token0 : token1;

  if (!quoteAddr || !tokenIn || !reserve0 || !reserve1) {
    console.error(
      "UniswapV2Pair:Swap - Quote address or token in or token0 balance or token1 balance not found"
    );
    return;
  }

  const assetBalance = isToken0 ? reserve0 : reserve1;
  const quoteBalance = isToken0 ? reserve1 : reserve0;

  const price = await computeV2Price({
    assetBalance,
    quoteBalance,
  });

  const dollarLiquidity = await computeDollarLiquidity({
    assetBalance,
    quoteBalance,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateBuckets({
    poolAddress,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateDailyVolume({
    poolAddress,
    amountIn,
    amountOut,
    timestamp: event.block.timestamp,
    context,
    tokenIn,
  });

  await db
    .update(pool, {
      address: poolAddress,
      chainId: BigInt(network.chainId),
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
