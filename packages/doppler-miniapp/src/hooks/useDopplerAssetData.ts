import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { ReadFactory } from "doppler-v3-sdk";
import { getDrift } from "../utils/drift";
import { useTokenData } from "./useToken";

export const fetchDopplerAssetData = async (
  airlock: Address,
  assetAddress: Address
) => {
  const drift = getDrift();
  const readFactory = new ReadFactory(airlock, drift);
  const assetData = await readFactory.getAssetData(assetAddress);

  return assetData;
};

export function useDopplerAssetData(airlock: Address, assetAddress: Address) {
  const assetDataQuery = useQuery({
    queryKey: ["doppler-asset-data", assetAddress],
    queryFn: async () => {
      return fetchDopplerAssetData(airlock, assetAddress);
    },
  });

  const asset = useTokenData(assetAddress, {
    queryKey: ["token-data", assetAddress],
    enabled: !!assetDataQuery.data,
  });
  const numeraire = useTokenData(assetDataQuery.data?.numeraire as Address, {
    queryKey: ["token-data", assetDataQuery.data?.numeraire],
    enabled: !!assetDataQuery.data,
  });

  const marketDetails = {
    assetData: assetDataQuery.data,
    asset: asset.data,
    numeraire: numeraire.data,
  };

  return {
    isLoading:
      assetDataQuery.isLoading || asset.isLoading || numeraire.isLoading,
    error: assetDataQuery.error || asset.error || numeraire.error,
    data: marketDetails,
  };
}
