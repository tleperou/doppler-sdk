import { CustomRouterABI, DERC20ABI } from '@/abis';
import { Doppler } from '@/entities/Doppler';
import { DopplerAddresses } from '@/types';
import {
  Address,
  BaseError,
  Client,
  ContractFunctionRevertedError,
  Hex,
} from 'viem';
import { readContract, simulateContract, writeContract } from 'viem/actions';

export async function sellAssetExactIn(
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
      functionName: 'sellExactIn',
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
    functionName: 'sellExactIn',
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

export async function sellAssetExactOut(
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

  const balance = await readContract(client, {
    address: doppler.assetToken.address as Address,
    abi: DERC20ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const { result: assetNeeded } = await simulateContract(client, {
    address: customRouter,
    abi: CustomRouterABI,
    functionName: 'computeSellExactOut',
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

  if (balance < assetNeeded) throw new Error('Insufficient balance');

  try {
    await simulateContract(client, {
      address: customRouter,
      abi: CustomRouterABI,
      functionName: 'sellExactOut',
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
    functionName: 'sellExactOut',
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
