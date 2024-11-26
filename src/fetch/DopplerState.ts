import {
  Address,
  Client,
  decodeAbiParameters,
  PublicClient,
  fromHex,
} from 'viem';
import { getChainId, readContract } from 'viem/actions';
import { DopplerABI } from '../abis';
import { DopplerLensABI, DopplerLensBytecode } from '../abis';
import { encodeFunctionData } from 'viem';
import { HookState, HookConfig } from '../entities/Doppler';
import { ViewOverrides } from '../types';

export type FetchDopplerStateParams = {
  chainId?: number;
  overrides?: ViewOverrides;
};

export async function fetchDopplerState(
  dopplerAddress: Address,
  client: Client,
  { chainId, overrides = {} }: FetchDopplerStateParams = {}
): Promise<HookState> {
  chainId = chainId ?? (await getChainId(client));

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

export async function fetchDopplerImmutables(
  dopplerAddress: Address,
  client: PublicClient
): Promise<HookConfig> {
  const { data } = await client.call({
    code: DopplerLensBytecode,
    data: encodeFunctionData({
      abi: DopplerLensABI,
      functionName: 'getDopplerImmutables',
      args: [dopplerAddress],
    }),
  });

  if (!data) throw new Error('No data returned from call');
  const decoded = decodeAbiParameters(
    [
      { name: 'startingTime', type: 'uint256', internalType: 'uint256' },
      { name: 'endingTime', type: 'uint256', internalType: 'uint256' },
      { name: 'epochLength', type: 'uint256', internalType: 'uint256' },
      { name: 'isToken0', type: 'bool', internalType: 'bool' },
      { name: 'numTokensToSell', type: 'uint256', internalType: 'uint256' },
      { name: 'minimumProceeds', type: 'uint256', internalType: 'uint256' },
      { name: 'maximumProceeds', type: 'uint256', internalType: 'uint256' },
      { name: 'startingTick', type: 'int24', internalType: 'int24' },
      { name: 'endingTick', type: 'int24', internalType: 'int24' },
      { name: 'gamma', type: 'int24', internalType: 'int24' },
      { name: 'totalEpochs', type: 'uint256', internalType: 'uint256' },
      { name: 'numPDSlugs', type: 'uint256', internalType: 'uint256' },
    ],
    fromHex(data, 'bytes')
  );

  return {
    startingTime: decoded[0],
    endingTime: decoded[1],
    epochLength: Number(decoded[2]),
    isToken0: decoded[3],
    numTokensToSell: decoded[4],
    minimumProceeds: decoded[5],
    maximumProceeds: decoded[6],
    startingTick: decoded[7],
    endingTick: decoded[8],
    gamma: decoded[9],
    totalEpochs: Number(decoded[10]),
    numPDSlugs: Number(decoded[11]),
  };
}
