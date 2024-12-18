import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { ReadDerc20 } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";
import { QueryOptions, TokenData } from "../types";

export const fetchDerc20TokenData = async (
  tokenAddress: Address
): Promise<TokenData> => {
  const drift = getDrift();
  const token = new ReadDerc20(tokenAddress, drift);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.getName(),
    token.getSymbol(),
    token.getDecimals(),
    token.getTotalSupply(),
  ]);

  return {
    token,
    name,
    symbol,
    decimals,
    totalSupply,
  };
};

export function useTokenData(tokenAddress: Address, options?: QueryOptions) {
  const tokenDataQuery = useQuery({
    queryKey: ["token-data", tokenAddress],
    queryFn: async () => {
      return fetchDerc20TokenData(tokenAddress);
    },
    ...options,
  });

  return {
    isLoading: tokenDataQuery.isLoading,
    error: tokenDataQuery.error,
    data: tokenDataQuery.data,
  };
}
