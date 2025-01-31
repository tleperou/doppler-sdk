import {
  ReadContract,
  ReadAdapter,
  Drift,
  createDrift,
  FunctionReturn,
  FunctionArgs,
} from "@delvtech/drift";
import { Address } from "viem";
import { derc20Abi } from "../../../abis";

export type Derc20ABI = typeof derc20Abi;

/**
 * A class providing read-only access to a DERC20 token contract.
 * Enables querying standard ERC20 token properties along with custom vesting
 * and minting-related state information.
 */
export class ReadDerc20 {
  /** Underlying contract instance for direct DERC20 interactions */
  contract: ReadContract<Derc20ABI>;

  /**
   * Create a ReadDerc20 instance
   * @param address - Contract address of the DERC20 token
   * @param drift - Drift instance for blockchain interaction (defaults to new instance)
   */
  constructor(address: Address, drift: Drift<ReadAdapter> = createDrift()) {
    this.contract = drift.contract({ abi: derc20Abi, address });
  }

  /** Get the human-readable name of the token */
  async getName(): Promise<string> {
    return this.contract.read("name");
  }

  /** Get the symbol/ticker of the token */
  async getSymbol(): Promise<string> {
    return this.contract.read("symbol");
  }

  /** Get the number of decimals used for token divisions */
  async getDecimals(): Promise<number> {
    return this.contract.read("decimals");
  }

  /**
   * Get the allowance granted by an owner to a spender
   * @param params - Arguments for the allowance contract method
   */
  async getAllowance(
    params: FunctionArgs<Derc20ABI, "allowance">
  ): Promise<bigint> {
    return this.contract.read("allowance", params);
  }

  /**
   * Get the token balance of a specific account
   * @param account - Address to check balance for
   */
  async getBalanceOf(account: Address): Promise<bigint> {
    return this.contract.read("balanceOf", { account });
  }

  /** Get the total supply of tokens in circulation */
  async getTotalSupply(): Promise<bigint> {
    return this.contract.read("totalSupply");
  }

  /** Get the duration (in seconds) of the vesting period */
  async getVestingDuration(): Promise<bigint> {
    return this.contract.read("vestingDuration");
  }

  /** Get the timestamp when vesting begins */
  async getVestingStart(): Promise<bigint> {
    return this.contract.read("vestingStart");
  }

  /** Get the start timestamp of the current vesting year */
  async getCurrentYearStart(): Promise<bigint> {
    return this.contract.read("currentYearStart");
  }

  /** Get the current annual mint rate in tokens per year */
  async getCurrentAnnualMintRate(): Promise<bigint> {
    return this.contract.read("currentAnnualMint");
  }

  /** Check if the liquidity pool is unlocked */
  async getIsPoolUnlocked(): Promise<boolean> {
    return this.contract.read("isPoolUnlocked");
  }

  /** Get the timestamp when token minting begins */
  async getMintStartDate(): Promise<bigint> {
    return this.contract.read("mintStartDate");
  }

  /**
   * Get detailed vesting information for a specific account
   * @param account - Address to retrieve vesting data for
   * @returns Object containing:
   * - totalAmount: Total amount of tokens vested
   * - releasedAmount: Amount already claimed
   */
  async getVestingData(
    account: Address
  ): Promise<FunctionReturn<Derc20ABI, "getVestingDataOf">> {
    return this.contract.read("getVestingDataOf", { account });
  }
}
