import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { ReadUniswapV3Pool } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";
import {
  fetchDopplerAssetData,
  useDopplerAssetData,
} from "./useDopplerAssetData";
import { MarketDetails } from "../types";
import { fetchDerc20TokenData, useTokenData } from "./useToken";

const fetchPositionData = async (marketDetails: MarketDetails) => {
  const drift = getDrift();
  const { assetData } = marketDetails;
  const pool = new ReadUniswapV3Pool(assetData.pool, drift);

  const slot0 = await pool.getSlot0();

  const mintEvents = await pool.getMintEvents({
    fromBlock: 0n,
    toBlock: "latest",
    filter: {
      owner: assetData.poolInitializer,
    },
  });

  const positions = mintEvents.map((event) => ({
    tickLower: event.args?.tickLower ?? 0,
    tickUpper: event.args?.tickUpper ?? 0,
    liquidity: event.args?.amount ?? 0n,
  }));

  return {
    marketDetails,
    slot0,
    positions,
  };
};

export function usePoolData(airlock: Address, assetAddress: Address) {
  const {
    data: assetData,
    isLoading: assetDataLoading,
    error: assetDataError,
  } = useQuery({
    queryKey: ["doppler-asset-data", assetAddress],
    queryFn: async () => {
      return fetchDopplerAssetData(airlock, assetAddress);
    },
  });

  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useQuery({
    queryKey: ["token-data", assetAddress],
    queryFn: async () => {
      return fetchDerc20TokenData(assetAddress);
    },
  });

  const {
    data: numeraire,
    isLoading: numeraireLoading,
    error: numeraireError,
  } = useQuery({
    queryKey: ["token-data", assetData?.numeraire],
    queryFn: async () => {
      return fetchDerc20TokenData(assetData?.numeraire as Address);
    },
    enabled: !!assetData,
  });

  const {
    data: poolData,
    isLoading: poolDataLoading,
    error: poolDataError,
  } = useQuery({
    queryKey: ["pools", assetData?.pool],
    queryFn: async () => {
      if (!assetData || !asset || !numeraire) {
        throw new Error("Market details not found");
      }

      const poolDatas = await fetchPositionData({
        assetData,
        asset,
        numeraire,
      });
      return poolDatas;
    },
    enabled: !!assetData && !!asset && !!numeraire,
  });

  return {
    isLoading:
      poolDataLoading || assetDataLoading || assetLoading || numeraireLoading,
    error: poolDataError || assetDataError || assetError || numeraireError,
    data: poolData,
  };
}
