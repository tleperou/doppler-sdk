import {
  ReadContract,
  ReadAdapter,
  Drift,
  createDrift,
  FunctionReturn,
  FunctionArgs,
} from "@delvtech/drift";
import { Address } from "viem";
import { quoterV2Abi } from "../../abis";
import { fixed } from "../../fixedpoint";
import { FixedPoint } from "@delvtech/fixed-point-wasm";

export type FormattedAmount = FixedPoint;

export type QuoteOptions = {
  tokenInDecimals: number;
  tokenOutDecimals: number;
};

export type QuoterV2ABI = typeof quoterV2Abi;

export class ReadQuoter {
  quoter: ReadContract<QuoterV2ABI>;

  constructor(address: Address, drift: Drift<ReadAdapter> = createDrift()) {
    this.quoter = drift.contract({
      abi: quoterV2Abi,
      address,
    });
  }

  async quoteExactInput(
    params: FunctionArgs<QuoterV2ABI, "quoteExactInputSingle">,
    options?: QuoteOptions
  ): Promise<
    FunctionReturn<QuoterV2ABI, "quoteExactInputSingle"> & {
      formattedAmountOut: FormattedAmount;
    }
  > {
    const result = await this.quoter.simulateWrite(
      "quoteExactInputSingle",
      params
    );
    return {
      ...result,
      formattedAmountOut: fixed(result.amountOut, options?.tokenOutDecimals),
    };
  }

  async quoteExactOutput(
    params: FunctionArgs<QuoterV2ABI, "quoteExactOutputSingle">,
    options?: QuoteOptions
  ): Promise<
    FunctionReturn<QuoterV2ABI, "quoteExactOutputSingle"> & {
      formattedAmountIn: FormattedAmount;
    }
  > {
    const result = await this.quoter.simulateWrite(
      "quoteExactOutputSingle",
      params
    );
    return {
      ...result,
      formattedAmountIn: fixed(result.amountIn, options?.tokenInDecimals),
    };
  }
}
