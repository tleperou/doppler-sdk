import { DopplerABI } from '../abis/DopplerABI';
import { DopplerState } from '../types';
import { Address, Client } from 'viem';
import { getChainId, readContract } from 'viem/actions';

export type ViewOverrides = {
  blockNumber?: bigint;
  blockTag?: 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';
};

export type FetchDopplerStateParams = {
  chainId?: number;
  overrides?: ViewOverrides;
};

export async function fetchDopplerState(
  dopplerAddress: Address,
  client: Client,
  { chainId, overrides = {} }: FetchDopplerStateParams = {}
): Promise<DopplerState> {
  // Ensure we have the chain ID
  chainId = chainId ?? (await getChainId(client));

  // Fetch the state with any provided overrides
  const state = await readContract(client, {
    ...overrides,
    address: dopplerAddress,
    abi: DopplerABI,
    functionName: 'state',
  });

  // Process the fees data
  const feesAccrued = state[5];
  const amount0 = feesAccrued >> BigInt(128);
  const amount1 = feesAccrued & ((BigInt(1) << BigInt(128)) - BigInt(1));

  // Return a well-structured state object
  return {
    lastEpoch: state[0],
    tickAccumulator: state[1],
    totalTokensSold: state[2],
    totalProceeds: state[3],
    totalTokensSoldLastEpoch: state[4],
    feesAccrued: { amount0, amount1 },
  };
}

// Helper function to fetch multiple Doppler states in parallel
export async function fetchDopplerStates(
  dopplerAddresses: Address[],
  client: Client,
  params: FetchDopplerStateParams = {}
): Promise<DopplerState[]> {
  return Promise.all(
    dopplerAddresses.map(address => fetchDopplerState(address, client, params))
  );
}
