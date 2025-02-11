import { Address } from "viem";
import { DERC20ABI } from "@app/abis";
import { Context } from "ponder:registry";

export const computeV2Price = async ({
  reserve0,
  reserve1,
  baseToken,
  quoteToken,
  context,
}: {
  reserve0: bigint;
  reserve1: bigint;
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

  const baseScale = 10 ** baseDecimals;
  const quoteScale = 10 ** quoteDecimals;

  const numerator = reserve1 * BigInt(baseScale);
  const denominator = reserve0 * BigInt(quoteScale);

  return denominator === 0n ? 0n : numerator / denominator;
};
