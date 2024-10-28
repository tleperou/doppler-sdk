
// const DOPPLER_ADDRESS = '0x..';
// const AIRLOCK_ADDRESS = '0x..';
// const UNISWAP_V4_ADDRESS = '0x..';

import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";

/// TYPES

export interface CommonParams {
  /**
   * The pool manager address
   */
  poolManager: string,
  startingTime: bigint,
  endingTime: bigint,
  minimumProceeds: bigint,
  maximumProceeds: bigint,
  startingTick: number,
  endingTick: number,
  epochLength: bigint,
  gamma: number,
  isToken0: boolean,
}

export interface TokenParams {
  name: string,
  symbol: string,
  // initialSupply: bigint,
}

export interface DopplerSaltPredictionParams extends CommonParams {
  initialSupply: bigint,
}

export interface DopplerCreateParams extends DopplerSaltPredictionParams {
  salt: bigint,
}

export interface AirlockParams extends TokenParams, DopplerCreateParams {
  numeraire: string,
  owner: string,
  tokenFactory: string,
  tokenData: string,
  governanceFactory: string,
  governanceData: string,
  hookFactory: string,
  hookData: string,
  recipients: string[],
  amounts: bigint[],
}

export function encodeDopplerPredictParams(params: DopplerSaltPredictionParams) {
  params; // to stop ts from complaining; remove later
  // TODO: get DopplerFactory ABI
  // TODO: encode the call using `predict` function
  return {
    calldata: '0x',
    value: '0x',
  };
}

export function encodeDopplerCreateParams(params: DopplerCreateParams) {
  params; // to stop ts from complaining; remove later
  // TODO: get DopplerFactory ABI
  // TODO: encode the call using `create` function
  return {
    calldata: '0x',
    value: '0x',
  };
}

export function encodeAirlockCreateParams(params: AirlockParams) {
  params; // to stop ts from complaining; remove later

  // TODO: get AirlockFactory ABI
  // TODO: encode the call using `create` function

  return {
    calldata: '0x',
    value: '0x',
  };
}

/** 
 * Produces the parameters for the quote call to v4 pool
*/

// Initial version will simply use Quoter lens
// TBD if we should use CurrencyAmount<Token> or split into amount and token
export function encodeQuoteParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>) {
  /* from Quoter.sol, needs params: 
          PoolKey poolKey;
        bool zeroForOne;
        uint128 exactAmount;
        bytes hookData;
    */
  const zeroForOne = poolKey.currency0 === tokenInAmount.currency.address;
  const exactAmount = tokenInAmount.toExact(); // needs to convert to uint128
  const hookData = '0x';
  zeroForOne; // to stop ts from complaining; remove later
  exactAmount; // to stop ts from complaining; remove later
  hookData; // to stop ts from complaining; remove later

  // TODO: get Quoter lens ABI
  // TODO: encode the call
  return;
}

// TODO: not sure how to calculate this yet
export function encodeQuoteAheadParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>, epochsAhead: number) {
  const zeroForOne = poolKey.currency0 === tokenInAmount.currency.address;
  const exactAmount = tokenInAmount.toExact(); // needs to convert to uint128
  const hookData = '0x';

  zeroForOne; // to stop ts from complaining; remove later
  exactAmount; // to stop ts from complaining; remove later
  hookData; // to stop ts from complaining; remove later
  epochsAhead; // to stop ts from complaining; remove later
  return;
}

export function encodeSwapParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>, tokenOutAmount: CurrencyAmount<Token>) {
  poolKey; // to stop ts from complaining; remove later
  tokenInAmount; // to stop ts from complaining; remove later
  tokenOutAmount; // to stop ts from complaining; remove later

  // TODO: get SwapRouter (or Universal Router)ABI
  // TODO: encode the call using router sdk
  return {
    calldata: '0x',
    value: '0x',
  };
}

export function encodeTotalTokensSold(poolKey: PoolKey) {
  const hookAddress = poolKey.hooks;
  hookAddress; // to stop ts from complaining; remove later
  // get hook abi
  // encode function to call state.totalTokensSold
  return {
    calldata: '0x',
    value: '0x',
  };
}

export function encodeTotalProceeds(poolKey: PoolKey) {
  const hookAddress = poolKey.hooks;
  hookAddress; // to stop ts from complaining; remove later
  // get hook abi
  // encode function to call state.totalProceeds
  return {
    calldata: '0x',
    value: '0x',
  };
}