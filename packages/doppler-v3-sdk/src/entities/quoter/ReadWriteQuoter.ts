import { ReadWriteContract, ReadWriteAdapter, Drift } from "@delvtech/drift";
import { Address } from "viem";
import { quoterV2Abi } from "../../abis";

export type QuoteExactInputSingleParams = {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  fee: number;
  sqrtPriceLimitX96: bigint;
};

export type QuoteExactOutputSingleParams = {
  tokenIn: Address;
  tokenOut: Address;
  amount: bigint;
  fee: number;
  sqrtPriceLimitX96: bigint;
};

export type QuoteExactInputSingleResult = {
  amountOut: bigint;
  sqrtPriceX96After: bigint;
  initializedTicksCrossed: number;
  gasEstimate: bigint;
};

export type QuoteExactOutputSingleResult = {
  amountIn: bigint;
  sqrtPriceX96After: bigint;
  initializedTicksCrossed: number;
  gasEstimate: bigint;
};

export type QuoterV2ABI = typeof quoterV2Abi;

export class ReadWriteQuoter {
  quoter: ReadWriteContract<QuoterV2ABI>;

  constructor(address: Address, drift: Drift<ReadWriteAdapter> = new Drift()) {
    this.quoter = drift.contract({
      abi: quoterV2Abi,
      address,
    });
  }

  async quoteExactInput(
    params: QuoteExactInputSingleParams
  ): Promise<QuoteExactInputSingleResult> {
    return this.quoter.simulateWrite("quoteExactInputSingle", {
      params,
    });
  }

  async quoteExactOutput(
    params: QuoteExactOutputSingleParams
  ): Promise<QuoteExactOutputSingleResult> {
    return this.quoter.simulateWrite("quoteExactOutputSingle", {
      params,
    });
  }
}
