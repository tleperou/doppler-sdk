import { Address, Hex } from "viem";
import { Context } from "ponder:registry";
import { StateViewABI } from "@app/abis";

export interface Slot0Data {
  sqrtPrice: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
}

export interface V4PoolData {
  slot0Data: Slot0Data;
  liquidity: bigint;
}

export const getV4PoolData = async (
  poolId: Hex,
  stateViewAddress: Address,
  context: Context
): Promise<V4PoolData | null> => {
  try {
    const slot0 = await context.client.readContract({
      abi: StateViewABI,
      address: stateViewAddress,
      functionName: "getSlot0",
      args: [poolId],
    });

    const liquidity = await context.client.readContract({
      abi: StateViewABI,
      address: stateViewAddress,
      functionName: "getLiquidity",
      args: [poolId],
    });

    const slot0Data: Slot0Data = {
      sqrtPrice: slot0[0] ?? 0n,
      tick: slot0[1] ?? 0,
      protocolFee: slot0[2] ?? 0,
      lpFee: slot0[3] ?? 0,
    };

    const liquidityResult = liquidity ?? 0n;

    return {
      slot0Data,
      liquidity: liquidityResult,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};
