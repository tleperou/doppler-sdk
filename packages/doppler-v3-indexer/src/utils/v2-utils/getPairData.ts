import { DERC20ABI, UniswapV2PairABI } from "@app/abis";
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

  const [token0, token1, totalSupply, reserves] = await client.multicall({
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
      {
        abi: UniswapV2PairABI,
        address,
        functionName: "getReserves",
      },
    ],
  });

  const reserve0 = reserves.result?.[0];
  const reserve1 = reserves.result?.[1];

  return {
    token0: token0.result,
    token1: token1.result,
    totalSupply: totalSupply.result,
    reserve0,
    reserve1,
  };
};
