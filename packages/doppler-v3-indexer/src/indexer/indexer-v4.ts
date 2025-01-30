import { ponder } from "ponder:registry";
import { getAssetData } from "@app/utils/getAssetData";
import { asset, v4Pool } from "ponder.schema";
import { getV4PoolData } from "@app/utils/v4-utils";

ponder.on("UniswapV4Initializer:Create", async ({ event, context }) => {
  const { poolOrHook: hook, asset: assetId, numeraire } = event.args;

  const assetData = await getAssetData(assetId, context);

  if (!assetData) {
    console.error("UniswapV3Initializer:Create - Asset data not found");
    return;
  }

  const { slot0Data, liquidity, price } = await getV4PoolData({
    context,
    hook,
  });

  await context.db
    .insert(v4Pool)
    .values({
      ...slot0Data,
      hook,
      liquidity: liquidity,
      createdAt: event.block.timestamp,
      initializer: assetData.poolInitializer,
      asset: assetId,
      baseToken: assetId,
      quoteToken: numeraire,
      price,
    })
    .onConflictDoNothing();

  await context.db
    .insert(asset)
    .values({
      ...assetData,
      address: assetId,
      createdAt: event.block.timestamp,
      migratedAt: null,
    })
    .onConflictDoNothing();
});
