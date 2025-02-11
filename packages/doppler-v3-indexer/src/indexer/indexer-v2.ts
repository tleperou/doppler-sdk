import { ponder } from "ponder:registry";
import { getV3PoolData } from "@app/utils/v3-utils";
import { asset, position, pool, poolConfig } from "ponder.schema";
import {
  insertOrUpdateDailyVolume,
  computeDollarLiquidity,
  updateBuckets,
} from "./indexer-shared";
import { computeV2Price } from "@app/utils/v2-utils/computeV2Price";
import { getAssetData } from "@app/utils/getAssetData";
import { getPairData } from "@app/utils/v2-utils/getPairData";
import { configs } from "../../addresses";

ponder.on("UniswapV2Pair:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const address = event.log.address;
  const { amount0In, amount1In, amount0Out, amount1Out } = event.args;

  const { token0, token1, reserve0, reserve1 } = await getPairData({
    address,
    context,
  });

  const amountIn = amount0In > 0n ? amount0In : amount1In;
  const amountOut = amount0Out > 0n ? amount0Out : amount1Out;

  const assetAddr =
    token0?.toLowerCase() === configs[network.name].shared.weth.toLowerCase()
      ? token1
      : token0;

  if (!assetAddr) {
    console.error("UniswapV2Pair:Swap - Asset address not found");
    return;
  }

  const { pool: poolAddr } = await getAssetData(assetAddr, context);

  const isToken0 =
    token0?.toLowerCase() != configs[network.name].shared.weth.toLowerCase();

  const quoteAddr = isToken0 ? token1 : token0;
  const tokenIn = amount0In > 0n ? token0 : token1;

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

  await updateBuckets({
    poolAddress: poolAddr,
    price,
    timestamp: event.block.timestamp,
    context,
  });

  await insertOrUpdateDailyVolume({
    poolAddress: poolAddr,
    amountIn,
    amountOut,
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
