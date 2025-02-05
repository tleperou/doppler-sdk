import { Address } from "viem";
import { Context } from "ponder:registry";
import {
  DERC20ABI,
  UniswapV3InitializerABI,
  UniswapV3PoolABI,
} from "@app/abis";
import { addresses } from "@app/types/addresses";
import { computeV3Price } from "./computeV3Price";

export type PoolState = {
  asset: Address;
  numeraire: Address;
  tickLower: number;
  tickUpper: number;
  numPositions: number;
  isInitialized: boolean;
  isExited: boolean;
  maxShareToBeSold: bigint;
  maxShareToBond: bigint;
  initializer: Address;
};

export type V3PoolData = {
  slot0Data: {
    sqrtPrice: bigint;
    tick: number;
  };
  liquidity: bigint;
  token0: Address;
  token1: Address;
  poolState: PoolState;
  price: bigint;
  fee: number;
  token0Balance: bigint;
  token1Balance: bigint;
};

export const getV3PoolData = async ({
  address,
  context,
}: {
  address: Address;
  context: Context;
}): Promise<V3PoolData> => {
  const { client } = context;

  const [slot0, liquidity, token0, token1, fee] = await client.multicall({
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
      {
        abi: UniswapV3PoolABI,
        address,
        functionName: "fee",
      },
    ],
  });

  const poolState = await getPoolState({
    poolAddress: address,
    context,
  });

  const slot0Data = {
    sqrtPrice: slot0.result?.[0] ?? 0n,
    tick: slot0.result?.[1] ?? 0,
  };

  const liquidityResult = liquidity?.result ?? 0n;

  const token0Result = token0?.result ?? "0x";
  const token1Result = token1?.result ?? "0x";
  const feeResult = fee?.result ?? 3000;

  const [token0Balance, token1Balance] = await client.multicall({
    contracts: [
      {
        abi: DERC20ABI,
        address: token0Result,
        functionName: "balanceOf",
        args: [address],
      },
      {
        abi: DERC20ABI,
        address: token1Result,
        functionName: "balanceOf",
        args: [address],
      },
    ],
  });

  const token0BalanceResult = token0Balance?.result ?? 0n;
  const token1BalanceResult = token1Balance?.result ?? 0n;

  const price = await computeV3Price({
    sqrtPriceX96: slot0Data.sqrtPrice,
    token0: token0Result,
    baseToken: poolState.asset,
    context,
  });

  return {
    slot0Data,
    liquidity: liquidityResult,
    token0: token0Result,
    token1: token1Result,
    fee: feeResult,
    poolState,
    price,
    token0Balance: token0BalanceResult,
    token1Balance: token1BalanceResult,
  };
};

const getPoolState = async ({
  poolAddress,
  context,
}: {
  poolAddress: Address;
  context: Context;
}) => {
  const { client } = context;
  const { v3Initializer } = addresses.v3;

  const poolData = await client.readContract({
    abi: UniswapV3InitializerABI,
    address: v3Initializer,
    functionName: "getState",
    args: [poolAddress],
  });

  const poolState: PoolState = {
    asset: poolData[0],
    numeraire: poolData[1],
    tickLower: poolData[2],
    tickUpper: poolData[3],
    numPositions: poolData[4],
    isInitialized: poolData[5],
    isExited: poolData[6],
    maxShareToBeSold: poolData[7],
    maxShareToBond: poolData[8],
    initializer: v3Initializer,
  };

  return poolState;
};
