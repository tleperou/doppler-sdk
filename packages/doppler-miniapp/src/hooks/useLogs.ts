import { type Address, BlockTag, PublicClient } from "viem";
import { useQuery } from "@tanstack/react-query";

export interface LogsConfig {
  address?: Address | Address[];
  events: readonly unknown[];
  fromBlock?: bigint;
  toBlock?: BlockTag | bigint;
}

/**
 * Fetches event logs using viem's public client
 * @param client - Viem PublicClient instance
 * @param config - Configuration for log fetching (address, events, blocks)
 * @returns Query result containing logs
 */
export function useLogs(client: PublicClient, config: LogsConfig) {
  return useQuery({
    queryKey: ["logs", client.uid, config],
    queryFn: async () => {
      const logs = await client.getLogs({
        address: config.address,
        events: config.events,
        fromBlock: config.fromBlock,
        toBlock: config.toBlock,
      });
      return logs;
    },
  });
}
