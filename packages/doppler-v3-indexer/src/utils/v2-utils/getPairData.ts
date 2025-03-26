import { DERC20ABI, UniswapV2PairABI } from "@app/abis";
import { Context } from "ponder:registry";
import { Address, Hex } from "viem";

export const getPairData = async ({
  address,
  context,
}: {
  address: Hex;
  context: Context;
}) => {
  const { client, network } = context;

  let multiCallAddress = {};
  if (network.name == "ink") {
    multiCallAddress = {
      multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    };
  }

  const [token0Result, token1Result] = await client.multicall({
    contracts: [
      {
        abi: UniswapV2PairABI,
        address,
        functionName: "token0",
      },
      {
        abi: UniswapV2PairABI,
        address,
        functionName: "token1",
      },
    ],
    ...multiCallAddress,
  });

  const token0 = token0Result.result;
  const token1 = token1Result.result;

  const [reserve0Result, reserve1Result] = await client.multicall({
    contracts: [
      {
        abi: DERC20ABI,
        address: token0 as Address,
        functionName: "balanceOf",
        args: [address],
      },
      {
        abi: DERC20ABI,
        address: token1 as Address,
        functionName: "balanceOf",
        args: [address],
      },
    ],
    ...multiCallAddress,
  });

  const reserve0 = reserve0Result.result;
  const reserve1 = reserve1Result.result;

  if (!token0 || !token1 || !reserve0 || !reserve1) {
    console.error("Pair data not found");
    return null;
  }

  return {
    token0,
    token1,
    reserve0,
    reserve1,
  };
};
