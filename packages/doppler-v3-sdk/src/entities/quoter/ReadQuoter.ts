import {
  ReadContract,
  ReadAdapter,
  Drift,
  createDrift,
  FunctionReturn,
  FunctionArgs,
} from "@delvtech/drift";
import { Address } from "viem";
import { quoterV2Abi, uniswapV2Router02Abi } from "../../abis";

/**
 * Type alias for QuoterV2 contract ABI
 */
export type QuoterV2ABI = typeof quoterV2Abi;
export type UniswapV2Router02ABI = typeof uniswapV2Router02Abi;

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
 * });
 * ```
 */
export class ReadQuoter {
  /** Underlying QuoterV2 contract instance */
  quoter: ReadContract<QuoterV2ABI>;
  univ2Router: ReadContract<UniswapV2Router02ABI>;

  /**
   * Create a ReadQuoter instance
   * @param quoteV2Address - Contract address of the QuoterV2
   * @param univ2RouterAddress - Contract address of the Uniswap V2 Router
   * @param drift - Drift instance for blockchain interaction (defaults to new instance)
   */
  constructor(
    quoteV2Address: Address,
    univ2RouterAddress: Address,
    drift: Drift<ReadAdapter> = createDrift()
  ) {
    this.quoter = drift.contract({
      abi: quoterV2Abi,
      address: quoteV2Address,
    });
    this.univ2Router = drift.contract({
      abi: uniswapV2Router02Abi,
      address: univ2RouterAddress,
    });
  }

  /**
   * Get a price quote for swapping an exact amount of input tokens
   * @param params - Arguments for the quoteExactInputSingle contract method
   * @param options - Formatting options for the output amount, defaults to 18 decimals
   * @returns Promise resolving to:
   * - Raw contract return values
   */
  async quoteExactInputV3(
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
  async quoteExactOutputV3(
    params: FunctionArgs<QuoterV2ABI, "quoteExactOutputSingle">["params"]
  ): Promise<FunctionReturn<QuoterV2ABI, "quoteExactOutputSingle">> {
    return await this.quoter.simulateWrite("quoteExactOutputSingle", {
      params: { ...params },
    });
  }
  /**
   * Get a price quote for swapping an exact amount of input tokens using Uniswap V2
   * @param params - Arguments for the swapExactTokensForTokens contract method containing:
   *  - amountIn: Exact amount of input tokens to swap
   *  - amountOutMin: Minimum amount of output tokens to receive
   *  - path: Array of token addresses representing swap path
   *  - to: Recipient address of output tokens
   *  - deadline: Unix timestamp deadline for transaction validity
   * @returns Promise resolving to raw contract return values including:
   *  - amounts: Array of input/output amounts at each swap step
   */
  async quoteExactInputV2(
    params: FunctionArgs<UniswapV2Router02ABI, "swapExactTokensForTokens">
  ): Promise<FunctionReturn<UniswapV2Router02ABI, "swapExactTokensForTokens">> {
    return await this.univ2Router.simulateWrite("swapExactTokensForTokens", {
      ...params,
    });
  }

  /**
   * Get a price quote for receiving an exact amount of output tokens using Uniswap V2
   * @param params - Arguments for the swapExactTokensForTokens contract method containing:
   *  - amountOut: Exact amount of output tokens to receive
   *  - amountInMax: Maximum amount of input tokens to spend
   *  - path: Array of token addresses representing swap path
   *  - to: Recipient address of output tokens
   *  - deadline: Unix timestamp deadline for transaction validity
   * @returns Promise resolving to raw contract return values including:
   *  - amounts: Array of input/output amounts at each swap step
   */
  async quoteExactOutputV2(
    params: FunctionArgs<UniswapV2Router02ABI, "swapExactTokensForTokens">
  ): Promise<FunctionReturn<UniswapV2Router02ABI, "swapExactTokensForTokens">> {
    return await this.univ2Router.simulateWrite("swapExactTokensForTokens", {
      ...params,
    });
  }

  /**
   * Get a price quote for swapping an exact amount of ETH for tokens using Uniswap V2
   * @param amountIn - Amount of ETH to swap
   * @param params - Arguments for the swapExactETHForTokens contract method containing:
   *  - amountOutMin: Minimum amount of output tokens to receive
   *  - path: Array of token addresses representing swap path (first address should be WETH)
   *  - to: Recipient address of output tokens
   *  - deadline: Unix timestamp deadline for transaction validity
   * @returns Promise resolving to raw contract return values including:
   *  - amounts: Array of input/output amounts at each swap step
   */
  async quoteExactInputV2ETH(
    amountIn: bigint,
    params: FunctionArgs<UniswapV2Router02ABI, "swapExactETHForTokens">
  ): Promise<readonly bigint[]> {
    return await this.univ2Router.simulateWrite(
      "swapExactETHForTokens",
      {
        ...params,
      },
      {
        value: amountIn,
      }
    );
  }

  /**
   * Get a price quote for receiving an exact amount of ETH from tokens using Uniswap V2
   * @param amountOut - Amount of ETH to receive
   * @param params - Arguments for the swapExactTokensForETH contract method containing:
   *  - amountInMax: Maximum amount of input tokens to spend
   *  - amountOut: Exact amount of ETH to receive
   *  - path: Array of token addresses representing swap path (last address should be WETH)
   *  - to: Recipient address of output ETH
   *  - deadline: Unix timestamp deadline for transaction validity
   * @returns Promise resolving to raw contract return values including:
   *  - amounts: Array of input/output amounts at each swap step
   */
  async quoteExactOutputV2ETH(
    amountOut: bigint,
    params: FunctionArgs<UniswapV2Router02ABI, "swapExactTokensForETH">
  ): Promise<readonly bigint[]> {
    return await this.univ2Router.simulateWrite(
      "swapExactTokensForETH",
      {
        ...params,
      },
      {
        value: amountOut,
      }
    );
  }
}
