import { useQuery } from "@tanstack/react-query";
import { ReadFactory, ReadDerc20 } from "doppler-v3-sdk";

export function usePoolData(readDerc20: ReadDerc20) {
  return useQuery({
    queryKey: ["create-events", readFactory.airlock.address],
    queryFn: async () => {
      const logs = await readFactory.getCreateEvents({
        fromBlock: 0n,
        toBlock: "latest",
      });
      const assetDatas = await Promise.all(
        logs.map((log) => readFactory.getAssetData(log.args.asset))
      );
      return { data: assetDatas };
    },
  });
}
