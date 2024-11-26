import { DopplerABI } from '../abis';
import { StateViewABI } from '../abis';
import { PoolState, Position } from '../entities/Doppler';
import { Hex, Address, Client } from 'viem';
import { getBlock, getChainId, readContract } from 'viem/actions';
import { ViewOverrides } from '../types';

export type FetchPositionStateParams = {
  chainId?: number;
  overrides?: ViewOverrides;
};

export async function fetchPoolState(
  address: Address,
  stateView: Address,
  client: Client,
  poolId: Hex,
  { chainId, overrides = {} }: FetchPositionStateParams = {}
): Promise<PoolState> {
  // Ensure we have the chain ID
  chainId = chainId ?? (await getChainId(client));

  const { timestamp } = await getBlock(client);

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

  const slot0 = await readContract(client, {
    ...overrides,
    address: stateView,
    abi: StateViewABI,
    functionName: 'getSlot0',
    args: [poolId],
  });

  const sqrtPriceX96 = slot0[0];
  const price = (sqrtPriceX96 * sqrtPriceX96) / BigInt(2 ** 192);
  const currentTick = slot0[1];

  return {
    positions: [
      fromRaw(lowerSlugState),
      fromRaw(upperSlugState),
      ...pdSlugStates.map(fromRaw),
    ],
    currentTick,
    currentPrice: price,
    lastSyncedTimestamp: timestamp,
  };
}

function fromRaw(raw: any): Position {
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
