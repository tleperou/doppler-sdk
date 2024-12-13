import { useToken } from "wagmi";
import { trimPaddedAddress } from "../utils/address";

export interface TokenData {
  name: string | undefined;
  symbol: string | undefined;
  decimals: number | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch token data for a given address
 * @param address - The token contract address (can be padded or unpadded)
 * @returns TokenData object containing name, symbol, decimals, loading state and error
 */
export function useTokenData(address: string): TokenData {
  // Trim the address if it's padded
  const tokenAddress = trimPaddedAddress(address);

  const {
    data: token,
    isLoading,
    error,
  } = useToken({
    address: tokenAddress as `0x${string}`,
  });

  return {
    name: token?.name,
    symbol: token?.symbol,
    decimals: token?.decimals,
    isLoading,
    error: error as Error | null,
  };
}
