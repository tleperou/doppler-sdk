import { Context, ponder } from "ponder:registry";
import {
  asset,
  user,
  userAsset,
  v3Pool,
  position,
  token,
  hourBucket,
} from "../ponder.schema";
import { AirlockABI } from "../abis/AirlockABI";
import { UniswapV3PoolABI } from "../abis/UniswapV3PoolABI";
import { Address, Hex, zeroAddress } from "viem";
import { DERC20ABI } from "../abis/DERC20ABI";

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

const secondsInHour = 3600;

const Q96 = BigInt(2) ** BigInt(96);
const Q192 = Q96 * Q96;

const insertOrUpdateHourBucket = async ({
  poolAddress,
  baseToken,
  sqrtPrice,
  timestamp,
  context,
}: {
  poolAddress: Address;
  baseToken: Address;
  sqrtPrice: bigint;
  timestamp: bigint;
  context: Context;
}) => {
  const hourId = Math.floor(Number(timestamp) / secondsInHour) * secondsInHour;

  const { token0, token1 } = await getV3PoolData({
    address: poolAddress,
    context,
  });

  const isToken0 = token0.toLowerCase() === baseToken.toLowerCase();
  const assetBefore = isToken0
    ? token0.toLowerCase() < token1.toLowerCase()
    : token1.toLowerCase() < token0.toLowerCase();

  const priceX192 = sqrtPrice * sqrtPrice;
  const price = assetBefore ? Q192 / priceX192 : priceX192 / Q192;

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
};

const getV3PoolData = async ({
  address,
  context,
}: {
  address: Address;
  context: Context;
}) => {
  const client = context.client;

  const [slot0, liquidity, token0, token1] = await client.multicall({
    contracts: [
      {
        abi: UniswapV3PoolABI,
        address,
        functionName: "slot0",
      },
      {
        abi: UniswapV3PoolABI,
        address,
        functionName: "liquidity",
      },
      {
        abi: UniswapV3PoolABI,
        address,
        functionName: "token0",
      },
      {
        abi: UniswapV3PoolABI,
        address,
        functionName: "token1",
      },
    ],
  });

  const slot0Data = {
    sqrtPrice: slot0.result?.[0] ?? 0n,
    tick: slot0.result?.[1] ?? 0,
  };

  const liquidityResult = liquidity.result ?? 0n;
  const token0Result = token0.result ?? "Unknown Token";
  const token1Result = token1.result ?? "Unknown Token";

  return {
    slot0Data,
    liquidity: liquidityResult,
    token0: token0Result,
    token1: token1Result,
  };
};

const insertTokenIfNotExists = async ({
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

ponder.on("Airlock:Create", async ({ event, context }) => {
  const { client } = context;
  const { Airlock } = context.contracts;
  const { asset: assetId, poolOrHook } = event.args;

  const assetData = await client.readContract({
    abi: AirlockABI,
    address: Airlock.address,
    functionName: "getAssetData",
    args: [assetId],
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

  await context.db
    .insert(asset)
    .values({
      address: assetId,
      ...assetDataStruct,
      createdAt: event.block.timestamp,
      migratedAt: null,
      isDerc20: true,
    })
    .onConflictDoNothing();

  const { slot0Data, liquidity, token0, token1 } = await getV3PoolData({
    address: poolOrHook,
    context,
  });

  const baseToken = assetId;
  const quoteToken =
    assetId.toLowerCase() === token0.toLowerCase() ? token1 : token0;

  await context.db
    .insert(v3Pool)
    .values({
      id: poolOrHook,
      ...slot0Data,
      liquidity: liquidity,
      createdAt: event.block.timestamp,
      baseToken: baseToken as Address,
      quoteToken: quoteToken as Address,
    })
    .onConflictDoNothing();
});

ponder.on("Airlock:Migrate", async ({ event, context }) => {
  const { db } = context;
  const { asset: assetId } = event.args;
  const { client } = context;
  const { Airlock } = context.contracts;

  const assetData = await client.readContract({
    abi: AirlockABI,
    address: Airlock.address,
    functionName: "getAssetData",
    args: [assetId],
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

  await db
    .insert(asset)
    .values({
      address: assetId,
      ...assetDataStruct,
      createdAt: event.block.timestamp,
      migratedAt: event.block.timestamp,
      isDerc20: true,
    })
    .onConflictDoUpdate((row) => ({
      migratedAt: event.block.timestamp,
    }));
});

ponder.on("UniswapV3Pool:Mint", async ({ event, context }) => {
  const { db, client, network } = context;
  const pool = event.log.address;
  const { tickLower, tickUpper, amount, owner } = event.args;

  const chainId = BigInt(network.chainId);

  const { slot0Data, token0, token1 } = await getV3PoolData({
    address: pool,
    context,
  });

  const token0Data = await db.find(token, {
    address: token0 as Address,
  });

  const token1Data = await db.find(token, {
    address: token1 as Address,
  });

  const baseToken = token0Data?.isDerc20 ? token0 : token1;

  if (!token0Data) {
    await insertTokenIfNotExists({
      address: token0 as Address,
      chainId,
      timestamp: event.block.timestamp,
      context,
      isDerc20: false,
    });
  }

  if (!token1Data) {
    await insertTokenIfNotExists({
      address: token1 as Address,
      chainId,
      timestamp: event.block.timestamp,
      context,
      isDerc20: false,
    });
  }

  await insertOrUpdateHourBucket({
    poolAddress: pool,
    baseToken: baseToken as Address,
    sqrtPrice: slot0Data.sqrtPrice,
    timestamp: event.block.timestamp,
    context,
  });

  await db
    .insert(position)
    .values({
      id: `${owner}-${pool}-${tickLower}-${tickUpper}`,
      owner: owner,
      pool: pool,
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidity: amount,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({ liquidity: row.liquidity + amount }));
});

ponder.on("UniswapV3Pool:Burn", async ({ event, context }) => {
  const { db } = context;
  const pool = event.log.address;
  const { tickLower, tickUpper, owner } = event.args;

  await db
    .insert(position)
    .values({
      id: `${owner}-${pool}-${tickLower}-${tickUpper}`,
      owner: owner,
      pool: pool,
      tickLower: tickLower,
      tickUpper: tickUpper,
      liquidity: event.args.amount,
      createdAt: event.block.timestamp,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: row.liquidity - event.args.amount,
    }));
});

ponder.on("UniswapV3Pool:Swap", async ({ event, context }) => {
  const { db, network } = context;
  const pool = event.log.address;

  const { slot0Data, liquidity, token0, token1 } = await getV3PoolData({
    address: pool,
    context,
  });

  const poolData = await db.find(v3Pool, {
    id: pool,
  });

  const baseToken = poolData?.baseToken;
  const quoteToken = poolData?.quoteToken;

  await insertOrUpdateHourBucket({
    poolAddress: pool,
    baseToken: baseToken as Address,
    sqrtPrice: slot0Data.sqrtPrice,
    timestamp: event.block.timestamp,
    context,
  });

  await db
    .insert(v3Pool)
    .values({
      id: pool,
      ...slot0Data,
      liquidity: liquidity,
      createdAt: event.block.timestamp,
      baseToken: baseToken as Address,
      quoteToken: quoteToken as Address,
    })
    .onConflictDoUpdate((row) => ({
      liquidity: liquidity,
      ...slot0Data,
    }));
});

ponder.on("DERC20:Transfer", async ({ event, context }) => {
  const userAddress = event.transaction.from;
  const { db, network } = context;
  const { address } = event.log;

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
      id: event.args.from,
      address: event.args.from,
      createdAt: event.block.timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(userAsset)
    .values({
      id: `${userAddress}-${address}`,
      userId: userAddress,
      assetId: address,
    })
    .onConflictDoNothing();
});
