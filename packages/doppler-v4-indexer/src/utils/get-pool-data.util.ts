import {Address, Hex} from "viem";
import {Context} from "ponder:registry";
import {stateViewAbi} from "@app/abis";

export interface Slot0Data {
    sqrtPrice: bigint;
    tick: number;
    protocolFee: number;
    lpFee: number;
}

export interface PoolData {
    slot0Data: Slot0Data;
    liquidity: bigint;
}

export const getPoolData = async (poolId: Hex, stateViewAddress: Address, context: Context): Promise<PoolData> => {
    const client = context.client;

    // Get slot0 data using state view contract
    const slot0 = await client.readContract({
        abi: stateViewAbi,
        address: stateViewAddress,
        functionName: "getSlot0",
        args: [poolId],
    });
    console.debug(`Slot0 data: ${slot0}`);

    // Get liquidity data using state view contract
    const liquidity = await client.readContract({
        abi: stateViewAbi,
        address: stateViewAddress,
        functionName: "getLiquidity",
        args: [poolId],
    });
    console.debug(`Liquidity: ${liquidity}`);

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
}
