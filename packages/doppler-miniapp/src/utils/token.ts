import { Address, Client, PublicClient, formatUnits } from "viem";
import { trimPaddedAddress } from "./address";

export interface TokenData {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  poolBalance?: bigint;
}

// ERC20 ABI for the functions we need
const erc20Abi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Fetches token data for a given address using viem public client
 * @param address - The token contract address (can be padded or unpadded)
 * @returns Promise resolving to TokenData object containing name, symbol, and decimals
 */
export async function getTokenData(
  address: Address,
  publicClient: PublicClient
): Promise<TokenData> {
  const [name, symbol, decimals] = await Promise.all([
    publicClient.readContract({
      address,
      abi: erc20Abi,
      functionName: "name",
    }),
    publicClient.readContract({
      address,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    publicClient.readContract({
      address,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);

  return {
    address,
    name,
    symbol,
    decimals,
  };
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
