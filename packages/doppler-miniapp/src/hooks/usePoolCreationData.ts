import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ReadDerc20, ReadFactory } from "doppler-v3-sdk";
import { Address } from "viem";
import { getDrift } from "../utils/drift";

export interface AssetData {
  asset: ReadDerc20;
  numeraire: ReadDerc20;
  pool: Address;
  governance: Address;
  liquidityMigrator: Address;
  migrationPool: Address;
  poolInitializer: Address;
  timelock: Address;
}

export function useFetchCreatedAssets(
  airlock: Address
): UseQueryResult<AssetData[]> {
  const drift = getDrift();
  const readFactory = new ReadFactory(airlock, drift);

  return useQuery({
    queryKey: ["create-events", airlock],
    queryFn: async () => {
      const logs = await readFactory.getCreateEvents({
        fromBlock: 0n,
        toBlock: "latest",
      });
      const assetDatas = await Promise.all(
        logs.map(async (log) => {
          const assetData = await readFactory.getAssetData(log.args.asset);
          const { numeraire, ...rest } = assetData;
          return {
            ...rest,
            asset: new ReadDerc20(log.args.asset, drift),
            numeraire: new ReadDerc20(log.args.numeraire, drift),
          };
        })
      );

      return { assetDatas };
    },
  });
}
