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

/**
 * Type alias for QuoterV2 contract ABI
 */
export type QuoterV2ABI = typeof quoterV2Abi;

/**
 * A read-only interface to the Uniswap V3 QuoterV2 contract that provides:
 * - Price quotes for exact input and output swaps
 * - Formatted amounts with proper decimal handling
 * - Simulation of swap outcomes without executing transactions
 *
 * @example
 * ```typescript
 * const quoter = new ReadQuoter("0x...");
 * const quote = await quoter.quoteExactInput({
 *   tokenIn: "0x...",
 *   tokenOut: "0x...",
 *   amountIn: 1000000n,
 *   fee: 3000,
 *   sqrtPriceLimitX96: 0n
 * }, { tokenInDecimals: 6, tokenOutDecimals: 18 });
 * ```
 */
export class ReadQuoter {
  /** Underlying QuoterV2 contract instance */
  quoter: ReadContract<QuoterV2ABI>;

  /**
   * Create a ReadQuoter instance
   * @param address - Contract address of the QuoterV2
   * @param drift - Drift instance for blockchain interaction (defaults to new instance)
   */
  constructor(address: Address, drift: Drift<ReadAdapter> = createDrift()) {
    this.quoter = drift.contract({
      abi: quoterV2Abi,
      address,
    });
  }

  /**
   * Get a price quote for swapping an exact amount of input tokens
   * @param params - Arguments for the quoteExactInputSingle contract method
   * @param options - Formatting options for the output amount, defaults to 18 decimals
   * @returns Promise resolving to:
   * - Raw contract return values
   */
  async quoteExactInput(
    params: FunctionArgs<QuoterV2ABI, "quoteExactInputSingle">["params"]
  ): Promise<FunctionReturn<QuoterV2ABI, "quoteExactInputSingle">> {
    return await this.quoter.simulateWrite("quoteExactInputSingle", {
      params: { ...params },
    });
  }

  /**
   * Get a price quote for receiving an exact amount of output tokens
   * @param params - Arguments for the quoteExactOutputSingle contract method
   * @param options - Formatting options for the input amount, defaults to 18 decimals
   * @returns Promise resolving to:
   * - Raw contract return values
   */
  async quoteExactOutput(
    params: FunctionArgs<QuoterV2ABI, "quoteExactOutputSingle">["params"]
  ): Promise<FunctionReturn<QuoterV2ABI, "quoteExactOutputSingle">> {
    return await this.quoter.simulateWrite("quoteExactOutputSingle", {
      params: { ...params },
    });
  }
}
