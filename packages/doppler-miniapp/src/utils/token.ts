import { Address, PublicClient, formatUnits } from "viem";
import { ReadDerc20 } from "doppler-v3-sdk";

export interface TokenData {
  token: ReadDerc20;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  poolBalance?: bigint;
}

/**
 * Formats an amount using the token's decimals
 * @param amount - The amount to format (in smallest unit)
 * @param decimals - The number of decimals the token uses
 * @returns Formatted amount as a string
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}
