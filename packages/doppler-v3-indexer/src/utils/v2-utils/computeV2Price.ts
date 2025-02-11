import { Address } from "viem";
import { DERC20ABI } from "@app/abis";
import { Context } from "ponder:registry";
import { WAD } from "../constants";

export const computeV2Price = async ({
  assetBalance,
  quoteBalance,
  baseToken,
  quoteToken,
  context,
}: {
  assetBalance: bigint;
  quoteBalance: bigint;
  baseToken: Address;
  quoteToken: Address;
  context: Context;
}) => {
  const [baseDecimals, quoteDecimals] = await Promise.all([
    context.client.readContract({
      abi: DERC20ABI,
      address: baseToken,
      functionName: "decimals",
    }),
    context.client.readContract({
      abi: DERC20ABI,
      address: quoteToken,
      functionName: "decimals",
    }),
  ]);

  return (quoteBalance * WAD) / assetBalance;
};
