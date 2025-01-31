import {
  ReadContract,
  ReadAdapter,
  Drift,
  createDrift,
  FunctionReturn,
} from "@delvtech/drift";
import { Address } from "abitype";
import { derc20Abi } from "../../../abis";

export type Derc20ABI = typeof derc20Abi;

export class ReadDerc20 {
  contract: ReadContract<Derc20ABI>;

  constructor(
    address: `0x${string}`,
    drift: Drift<ReadAdapter> = createDrift()
  ) {
    this.contract = drift.contract({ abi: derc20Abi, address });
  }

  async getName(): Promise<string> {
    return this.contract.read("name");
  }

  async getSymbol(): Promise<string> {
    return this.contract.read("symbol");
  }

  async getDecimals(): Promise<number> {
    return this.contract.read("decimals");
  }

  async getAllowance(owner: Address, spender: Address): Promise<bigint> {
    return this.contract.read("allowance", { owner, spender });
  }

  async getBalanceOf(account: Address): Promise<bigint> {
    return this.contract.read("balanceOf", { account });
  }

  async getTotalSupply(): Promise<bigint> {
    return this.contract.read("totalSupply");
  }

  async getVestingData(
    account: Address
  ): Promise<FunctionReturn<Derc20ABI, "getVestingDataOf">> {
    return this.contract.read("getVestingDataOf", { account });
  }

  async getVestingDuration(): Promise<bigint> {
    return this.contract.read("vestingDuration");
  }

  async getVestingStart(): Promise<bigint> {
    return this.contract.read("vestingStart");
  }

  async getCurrentYearStart(): Promise<bigint> {
    return this.contract.read("currentYearStart");
  }

  async getCurrentAnnualMintRate(): Promise<bigint> {
    return this.contract.read("currentAnnualMint");
  }

  async getIsPoolUnlocked(): Promise<boolean> {
    return this.contract.read("isPoolUnlocked");
  }

  async getMintStartDate(): Promise<bigint> {
    return this.contract.read("mintStartDate");
  }
}
