import { BaseError, ContractFunctionRevertedError, Client, Hex } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';
import { DopplerAddressProvider } from '../AddressProvider';
import { CustomRouterABI } from '../abis/CustomRouter';
import { Doppler } from '../types';

export async function buyAsset(
  doppler: Doppler,
  addressProvider: DopplerAddressProvider,
  amount: bigint,
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
      functionName: 'buyExactIn',
      value: amount,
      args: [
        {
          ...doppler.poolKey,
          currency0: doppler.poolKey.currency0 as Hex,
          currency1: doppler.poolKey.currency1 as Hex,
          hooks: doppler.poolKey.hooks as Hex,
        },
        amount,
      ],
    });
  } catch (err) {
    console.log(err);
    if (err instanceof BaseError) {
      const revertError = err.walk(
        err => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        console.log(errorName);
      }
    }
  }

  return writeContract(client, {
    chain,
    account,
    address: customRouter,
    abi: CustomRouterABI,
    functionName: 'buyExactIn',
    value: amount,
    args: [
      {
        ...doppler.poolKey,
        currency0: doppler.poolKey.currency0 as Hex,
        currency1: doppler.poolKey.currency1 as Hex,
        hooks: doppler.poolKey.hooks as Hex,
      },
      amount,
    ],
  });
}
