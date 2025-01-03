import { ponder } from "ponder:registry";
import { assets, positions, v3Pools } from "../ponder.schema";
import { AirlockABI } from "../abis/AirlockABI";
import { UniswapV3PoolABI } from "../abis/UniswapV3PoolABI";
import { Hex } from "viem";

interface AssetData {
  numeraire: Hex;
  timelock: Hex;
  governance: Hex;
  liquidityMigrator: Hex;
  poolInitializer: Hex;
  pool: Hex;
  migrationPool: Hex;
  numTokensToSell: bigint;
  totalSupply: bigint;
  integrator: Hex;
}

ponder.on("Airlock:Create", async ({ event, context }) => {
  const { client } = context;
  const { Airlock } = context.contracts;
  const { asset, poolOrHook } = event.args;

  const assetData = await client.readContract({
    abi: AirlockABI,
    address: Airlock.address,
    functionName: "getAssetData",
    args: [event.args.asset],
  });

  const assetDataStruct: AssetData = {
    numeraire: assetData[0],
    timelock: assetData[1],
    governance: assetData[2],
    liquidityMigrator: assetData[3],
    poolInitializer: assetData[4],
    pool: assetData[5],
    migrationPool: assetData[6],
    numTokensToSell: assetData[7],
    totalSupply: assetData[8],
    integrator: assetData[9],
  };

  await context.db.insert(assets).values({
    id: event.args.asset,
    ...assetDataStruct,
    createdAt: new Date(Number(event.block.timestamp)),
    migratedAt: null,
  });

  const poolData = await client.readContract({
    abi: UniswapV3PoolABI,
    address: poolOrHook,
    functionName: "slot0",
  });

  const liquidity = await client.readContract({
    abi: UniswapV3PoolABI,
    address: poolOrHook,
    functionName: "liquidity",
  });

  const poolDataStruct = {
    sqrtPrice: poolData[0],
    tick: poolData[1],
  };

  await context.db.insert(v3Pools).values({
    id: poolOrHook,
    ...poolDataStruct,
    liquidity: liquidity,
    createdAt: new Date(Number(event.block.timestamp)),
  });
});

ponder.on("Airlock:Migrate", async ({ event, context }) => {
  const { assets } = context.db;

  await assets.update({
    id: event.args.asset,
    data: {
      migratedAt: new Date(Number(event.block.timestamp)),
    },
  });
});

ponder.on("UniswapV3Pool:Mint", async ({ event, context }) => {
  const { positions } = context.db;
  const pool = event.log.address;
  const { tickLower, tickUpper, amount, owner } = event.args;

  await positions.upsert({
    id: `${owner}-${pool}-${tickLower}-${tickUpper}`,
    create: {
      owner: owner,
      pool: pool,
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidity: amount,
      createdAt: new Date(Number(event.block.timestamp)),
    },
    update: ({ current }) => ({
      liquidity: current.liquidity + amount,
    }),
  });
});

ponder.on("UniswapV3Pool:Burn", async ({ event, context }) => {
  const { positions } = context.db;
  const pool = event.log.address;
  const { tickLower, tickUpper, owner } = event.args;

  await positions.update({
    id: `${owner}-${pool}-${tickLower}-${tickUpper}`,
    data: ({ current }) => ({
      liquidity: current.liquidity - event.args.amount,
    }),
  });
});
// ponder.on("Airlock:SetModuleState", async ({ event, context }) => {
//   const { modules } = context.db;

//   await context.db.insert(modules).values({
//     id: event.args.module,
//     state: event.args.state,
//     lastUpdated: new Date(Number(event.block.timestamp)),
//   });
// });
