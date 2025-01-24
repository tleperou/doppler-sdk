import { Address, Hex } from 'viem';
import { PoolKey } from '@/types';
import { basicRouterAbi } from '@/abis';

export type TradeParams = {
  pool: Address;
  recipient: Address;
  zeroForOne: boolean;
  deadline: bigint;
};

export type ExactInSingleV3Params = TradeParams & {
  amountIn: bigint;
  amountOutMinimum: bigint;
};

export type ExactOutSingleV3Params = TradeParams & {
  amountOut: bigint;
  amountInMaximum: bigint;
};

export type ExactInSingleV4Params = TradeParams & {
  amountIn: bigint;
  amountOutMinimum: bigint;
  key: PoolKey;
  hookData: Hex;
};

export type ExactOutSingleV4Params = TradeParams & {
  amountOut: bigint;
  amountInMaximum: bigint;
  key: PoolKey;
  hookData: Hex;
};

export type BasicRouterABI = typeof basicRouterAbi;
