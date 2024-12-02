import { CustomRouterABI } from '@/abis';
import { Doppler } from '@/entities/Doppler';
import { DopplerAddresses } from '@/types';
import { BaseError, Client, ContractFunctionRevertedError, Hex } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

export async function buyAssetExactIn(
  doppler: Doppler,
  addresses: DopplerAddresses,
  amountIn: bigint,
  client: Client
): Promise<Hex> {
  const chain = client.chain;
  const account = client?.account;

  if (!account) {
    throw new Error('Account not found');
  }

  const customRouter = addresses.customRouter;

  try {
    await simulateContract(client, {
      address: customRouter,
      abi: CustomRouterABI,
      functionName: 'buyExactIn',
      value: amountIn,
      args: [
        {
          ...doppler.poolKey,
          currency0: doppler.poolKey.currency0 as Hex,
          currency1: doppler.poolKey.currency1 as Hex,
          hooks: doppler.poolKey.hooks as Hex,
        },
        amountIn,
      ],
    });
  } catch (err) {
    if (err instanceof BaseError) {
      const revertError = err.walk(
        (err) => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        throw new Error(revertError.data?.errorName);
      }
    }
  }

  return writeContract(client, {
    chain,
    account,
    address: customRouter,
    abi: CustomRouterABI,
    functionName: 'buyExactIn',
    value: amountIn,
    args: [
      {
        ...doppler.poolKey,
        currency0: doppler.poolKey.currency0 as Hex,
        currency1: doppler.poolKey.currency1 as Hex,
        hooks: doppler.poolKey.hooks as Hex,
      },
      amountIn,
    ],
  });
}

export async function buyAssetExactOut(
  doppler: Doppler,
  addresses: DopplerAddresses,
  amountOut: bigint,
  client: Client
): Promise<Hex> {
  const chain = client.chain;
  const account = client?.account;
  const customRouter = addresses.customRouter;

  if (!account) {
    throw new Error('Account not found');
  }

  const { result: ethNeeded } = await simulateContract(client, {
    address: customRouter,
    abi: CustomRouterABI,
    functionName: 'computeBuyExactOut',
    args: [
      {
        ...doppler.poolKey,
        currency0: doppler.poolKey.currency0 as Hex,
        currency1: doppler.poolKey.currency1 as Hex,
        hooks: doppler.poolKey.hooks as Hex,
      },
      amountOut,
    ],
  });

  try {
    await simulateContract(client, {
      address: customRouter,
      abi: CustomRouterABI,
      functionName: 'buyExactOut',
      value: ethNeeded,
      args: [
        {
          ...doppler.poolKey,
          currency0: doppler.poolKey.currency0 as Hex,
          currency1: doppler.poolKey.currency1 as Hex,
          hooks: doppler.poolKey.hooks as Hex,
        },
        amountOut,
      ],
    });
  } catch (err) {
    if (err instanceof BaseError) {
      const revertError = err.walk(
        (err) => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        throw new Error(errorName);
      }
    }
  }

  return writeContract(client, {
    chain,
    account,
    address: customRouter,
    abi: CustomRouterABI,
    functionName: 'buyExactOut',
    value: ethNeeded,
    args: [
      {
        ...doppler.poolKey,
        currency0: doppler.poolKey.currency0 as Hex,
        currency1: doppler.poolKey.currency1 as Hex,
        hooks: doppler.poolKey.hooks as Hex,
      },
      amountOut,
    ],
  });
}
