import { UniswapV2PairABI } from "@app/abis";
import { Context } from "ponder:registry";
import { Hex } from "viem";

export const getPairData = async ({
  address,
  context,
}: {
  address: Hex;
  context: Context;
}) => {
  const { client } = context;

  const [token0, token1, totalSupply] = await client.multicall({
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
      {
        abi: UniswapV2PairABI,
        address,
        functionName: "totalSupply",
      },
    ],
  });

  return {
    token0: token0.result,
    token1: token1.result,
    totalSupply: totalSupply.result,
  };
};
