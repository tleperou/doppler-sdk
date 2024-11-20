import { DopplerABI } from '../../abis/DopplerABI';
import { Doppler, PositionState } from '../../types';
import { Client, Hex } from 'viem';
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
  dopplerAddress: Doppler,
  client: Client,
  { chainId, overrides = {} }: FetchPositionStateParams = {}
): Promise<PositionState[]> {
  // Ensure we have the chain ID
  chainId = chainId ?? (await getChainId(client));
  const { address } = dopplerAddress;

  const numPdSlugs = await readContract(client, {
    ...overrides,
    address,
    abi: DopplerABI,
    functionName: 'numPDSlugs',
  });

  // Fetch the state with any provided overrides
  const lowerSlugState = await readContract(client, {
    ...overrides,
    address,
    abi: DopplerABI,
    functionName: 'positions',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ],
  });

  const upperSlugState = await readContract(client, {
    ...overrides,
    address,
    abi: DopplerABI,
    functionName: 'positions',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000002',
    ],
  });

  const pdSlugStates = await Promise.all(
    getPdSalts(Number(numPdSlugs)).map(salt =>
      readContract(client, {
        ...overrides,
        address,
        abi: DopplerABI,
        functionName: 'positions',
        args: [salt],
      })
    )
  );

  return [
    fromRaw(lowerSlugState),
    fromRaw(upperSlugState),
    ...pdSlugStates.map(fromRaw),
  ];
}

function fromRaw(raw: any): PositionState {
  const type = raw[3] == 1 ? 'lowerSlug' : raw[3] == 2 ? 'upperSlug' : 'pdSlug';
  return {
    tickLower: raw[0],
    tickUpper: raw[1],
    liquidity: raw[2],
    salt: raw[3],
    type,
  };
}

function getPdSalts(numPdSlugs: number): Hex[] {
  return Array(numPdSlugs)
    .fill(0)
    .map((_, i) =>
      i < 7
        ? `0x000000000000000000000000000000000000000000000000000000000000000${i +
            3}`
        : `0x00000000000000000000000000000000000000000000000000000000000000${i +
            3}`
    ) as Hex[];
}
