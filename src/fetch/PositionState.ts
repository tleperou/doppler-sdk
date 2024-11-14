import { DopplerABI } from '../abis/DopplerABI';
import { PositionState } from '../types';
import { Address, Client } from 'viem';
import { getChainId, readContract } from 'viem/actions';

export type ViewOverrides = {
  blockNumber?: bigint;
  blockTag?: 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';
};

export type FetchPositionStateParams = {
  chainId?: number;
  overrides?: ViewOverrides;
};

export async function fetchPositionState(
  dopplerAddress: Address,
  client: Client,
  { chainId, overrides = {} }: FetchPositionStateParams = {}
): Promise<PositionState[]> {
  // Ensure we have the chain ID
  chainId = chainId ?? (await getChainId(client));

  // Fetch the state with any provided overrides
  const lowerSlugState = await readContract(client, {
    ...overrides,
    address: dopplerAddress,
    abi: DopplerABI,
    functionName: 'positions',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ],
  });

  const upperSlugState = await readContract(client, {
    ...overrides,
    address: dopplerAddress,
    abi: DopplerABI,
    functionName: 'positions',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000002',
    ],
  });

  const pdSlugState = await readContract(client, {
    ...overrides,
    address: dopplerAddress,
    abi: DopplerABI,
    functionName: 'positions',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000003',
    ],
  });

  return [
    fromRaw(lowerSlugState),
    fromRaw(upperSlugState),
    fromRaw(pdSlugState),
  ];
}

function fromRaw(raw: any): PositionState {
  return {
    tickLower: raw[0],
    tickUpper: raw[1],
    liquidity: raw[2],
    salt: raw[3],
  };
}

// export async function fetchPositionStates(
//   dopplerAddresses: Address[],
//   client: Client,
//   params: FetchPositionStateParams = {}
// ): Promise<PositionState[]> {
//   return Promise.all(
//     dopplerAddresses.map(address => fetchPositionState(address, client, params))
//   );
// }
