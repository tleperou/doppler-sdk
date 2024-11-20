import {
  BaseError,
  ContractFunctionRevertedError,
  Client,
  Hex,
  Address,
} from 'viem';
import { readContract, simulateContract, writeContract } from 'viem/actions';
import { DopplerAddressProvider } from '../AddressProvider';
import { CustomRouterABI } from '../abis/CustomRouter';
import { Doppler } from '../types';
import { DERC20ABI } from '../abis/DERC20ABI';

export async function sellAssetExactIn(
  doppler: Doppler,
  addressProvider: DopplerAddressProvider,
  amountIn: bigint,
  client: Client
): Promise<Hex> {
  const chain = client.chain;
  const account = client?.account;

  if (!account) {
    throw new Error('Account not found');
  }

  const customRouter = addressProvider.getAddresses().customRouter;

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
    console.log(err);
    if (err instanceof BaseError) {
      const revertError = err.walk(
        err => err instanceof ContractFunctionRevertedError
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
  addressProvider: DopplerAddressProvider,
  amountOut: bigint,
  client: Client
): Promise<Hex> {
  const chain = client.chain;
  const account = client?.account;
  const customRouter = addressProvider.getAddresses().customRouter;

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
        err => err instanceof ContractFunctionRevertedError
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
