import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { AssetData, ReadUniswapV3Pool, Slot0 } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";
import { useAssetData } from "./useMarketDetails";
import { useTokenData } from "./useToken";

interface PoolData {
  slot0: Slot0;
  positions: Position[];
}

interface Position {
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

const fetchPositionData = async (
  assetData: AssetData | undefined
): Promise<PoolData> => {
  if (!assetData) {
    throw "Asset data not found";
  }

  const drift = getDrift();
  const pool = new ReadUniswapV3Pool(assetData.pool, drift);

  const slot0 = await pool.getSlot0();

  const mintEvents = await pool.getMintEvents({
    fromBlock: 0n,
    toBlock: "latest",
    filter: {
      owner: assetData.poolInitializer,
    },
  });

  const positions: Position[] = mintEvents.map((event) => ({
    tickLower: event.args?.tickLower ?? 0,
    tickUpper: event.args?.tickUpper ?? 0,
    liquidity: event.args?.amount ?? 0n,
  }));

  return {
    slot0,
    positions,
  };
};

export function usePoolData(
  airlock: Address | undefined,
  assetAddress: Address | undefined
) {
  const assetDataQuery = useAssetData(airlock, assetAddress);
  const numeraireQuery = useTokenData(assetDataQuery.data?.numeraire);
  const assetQuery = useTokenData(assetAddress);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pools", assetDataQuery.data?.pool],
    queryFn: async () => {
      if (!assetDataQuery.data) {
        throw new Error("Market details not found");
      }

      const poolDatas = await fetchPositionData(assetDataQuery.data);

      return poolDatas;
    },
    enabled:
      Boolean(assetDataQuery.data) &&
      Boolean(numeraireQuery.data) &&
      Boolean(assetQuery.data),
  });

  return {
    isLoading:
      assetDataQuery.isLoading || numeraireQuery.isLoading || isLoading,
    error: assetDataQuery.error || numeraireQuery.error || error,
    data: {
      assetData: assetDataQuery.data,
      numeraire: numeraireQuery.data,
      asset: assetQuery.data,
      ...data,
    },
  };
}
