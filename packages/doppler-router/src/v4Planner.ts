import { encodeAbiParameters, Hex } from "viem";

/**
 * Actions
 * @description Constants that define what action to perform
 * @enum {number}
 */
export enum Actions {
  // pool actions
  // liquidity actions
  INCREASE_LIQUIDITY = 0x00,
  DECREASE_LIQUIDITY = 0x01,
  MINT_POSITION = 0x02,
  BURN_POSITION = 0x03,
  INCREASE_LIQUIDITY_FROM_DELTAS = 0x04,
  MINT_POSITION_FROM_DELTAS = 0x05,

  // swapping
  SWAP_EXACT_IN_SINGLE = 0x06,
  SWAP_EXACT_IN = 0x07,
  SWAP_EXACT_OUT_SINGLE = 0x08,
  SWAP_EXACT_OUT = 0x09,

  // closing deltas on the pool manager
  // settling
  SETTLE = 0x0b,
  SETTLE_ALL = 0x0c,
  // taking
  TAKE = 0x0e,
  TAKE_ALL = 0x0f,
  TAKE_PORTION = 0x10,

  CLOSE_CURRENCY = 0x12,
  SWEEP = 0x14,

  WRAP = 0x15,
  UNWRAP = 0x16,
}

const POOL_KEY_STRUCT = {
  name: "poolKey",
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
  ],
} as const;

const PATH_KEY_STRUCT = {
  name: "pathKey",
  type: "tuple",
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint256" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" },
  ],
} as const;

const SWAP_EXACT_IN_SINGLE_STRUCT = {
  name: "swapExactInSingle",
  type: "tuple",
  components: [
    { ...POOL_KEY_STRUCT },
    { name: "zeroForOne", type: "bool" },
    { name: "amountIn", type: "uint128" },
    { name: "amountOutMinimum", type: "uint128" },
    { name: "hookData", type: "bytes" },
  ],
} as const;

const SWAP_EXACT_IN_STRUCT = {
  name: "swapExactIn",
  type: "tuple",
  components: [
    { name: "currencyIn", type: "address" },
    { name: "path", type: "tuple[]", components: [{ ...PATH_KEY_STRUCT }] },
    { name: "amountIn", type: "uint128" },
    { name: "amountOutMinimum", type: "uint128" },
  ],
} as const;

const SWAP_EXACT_OUT_SINGLE_STRUCT = {
  name: "swapExactOutSingle",
  type: "tuple",
  components: [
    { ...POOL_KEY_STRUCT },
    { name: "zeroForOne", type: "bool" },
    { name: "amountOut", type: "uint128" },
    { name: "amountInMaximum", type: "uint128" },
    { name: "hookData", type: "bytes" },
  ],
} as const;

const SWAP_EXACT_OUT_STRUCT = {
  name: "swapExactOut",
  type: "tuple",
  components: [
    { name: "currencyOut", type: "address" },
    { name: "path", type: "tuple[]", components: [{ ...PATH_KEY_STRUCT }] },
    { name: "amountOut", type: "uint128" },
    { name: "amountInMaximum", type: "uint128" },
  ],
} as const;

const ABI_DEFINITION: { [key in Actions]: any[] } = {
  // Liquidity commands
  [Actions.INCREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" },
  ],
  [Actions.DECREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" },
  ],
  [Actions.MINT_POSITION]: [
    { ...POOL_KEY_STRUCT },
    { type: "int24" },
    { type: "int24" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" },
  ],
  [Actions.BURN_POSITION]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" },
  ],
  [Actions.INCREASE_LIQUIDITY_FROM_DELTAS]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" },
  ],
  [Actions.MINT_POSITION_FROM_DELTAS]: [
    { ...POOL_KEY_STRUCT },
    { type: "int24" },
    { type: "int24" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" },
  ],

  // Swapping commands
  [Actions.SWAP_EXACT_IN_SINGLE]: [{ ...SWAP_EXACT_IN_SINGLE_STRUCT }],
  [Actions.SWAP_EXACT_IN]: [{ ...SWAP_EXACT_IN_STRUCT }],
  [Actions.SWAP_EXACT_OUT_SINGLE]: [{ ...SWAP_EXACT_OUT_SINGLE_STRUCT }],
  [Actions.SWAP_EXACT_OUT]: [{ ...SWAP_EXACT_OUT_STRUCT }],

  // Payments commands
  [Actions.SETTLE]: [
    { type: "address" },
    { type: "uint256" },
    { type: "bool" },
  ],
  [Actions.SETTLE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [Actions.TAKE]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" },
  ],
  [Actions.TAKE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [Actions.TAKE_PORTION]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" },
  ],

  [Actions.CLOSE_CURRENCY]: [{ type: "address" }],
  [Actions.SWEEP]: [{ type: "address" }, { type: "address" }],

  [Actions.WRAP]: [{ type: "uint256" }],
  [Actions.UNWRAP]: [{ type: "uint256" }],
};

export class V4Planner {
  actions: Hex = "0x";
  params: Hex[] = [];

  constructor() {
    this.actions = "0x";
    this.params = [];
  }

  addAction(type: Actions, parameters: any[]): void {
    const command = createAction(type, parameters);
    this.params.push(command.encodedInput);
    this.actions = (this.actions + type.toString(16).padStart(2, "0")) as Hex;
  }

  finalize(): Hex {
    return encodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      [this.actions, this.params]
    );
  }
}

export type RouterAction = {
  action: Actions;
  encodedInput: Hex;
};

export function createAction(action: Actions, parameters: any[]): RouterAction {
  const encodedInput = encodeAbiParameters(ABI_DEFINITION[action], parameters);
  return { action, encodedInput };
}
