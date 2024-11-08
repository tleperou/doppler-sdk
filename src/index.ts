// const DOPPLER_ADDRESS = '0x..';
// const AIRLOCK_ADDRESS = '0x..';
// const UNISWAP_V4_ADDRESS = '0x..';

// import { CurrencyAmount, Token } from "@uniswap/sdk-core";
// import { MethodParameters, PoolKey } from "@uniswap/v4-sdk";
// import { DopplerSaltPredictionParams, DopplerCreateParams, AirlockParams } from "./types";

// export function encodeDopplerPredictParams(params: DopplerSaltPredictionParams): MethodParameters {
//   params; // to stop ts from complaining; remove later
//   // TODO: get DopplerFactory ABI
//   // TODO: encode the call using `predict` function
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// export function encodeDopplerCreateParams(params: DopplerCreateParams): MethodParameters {
//   params; // to stop ts from complaining; remove later
//   // TODO: get DopplerFactory ABI
//   // TODO: encode the call using `create` function
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// export function encodeAirlockCreateParams(params: AirlockParams): MethodParameters {
//   params; // to stop ts from complaining; remove later

//   // TODO: get AirlockFactory ABI
//   // TODO: encode the call using `create` function

//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// /**
//  * Produces the parameters for the quote call to v4 pool
// */

// // Initial version will simply use Quoter lens
// // TBD if we should use CurrencyAmount<Token> or split into amount and token
// export function encodeQuoteParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>): MethodParameters {
//   /* from Quoter.sol, needs params:
//           PoolKey poolKey;
//         bool zeroForOne;
//         uint128 exactAmount;
//         bytes hookData;
//     */
//   const zeroForOne = poolKey.currency0 === tokenInAmount.currency.address;
//   const exactAmount = tokenInAmount.toExact(); // needs to convert to uint128
//   const hookData = '0x';
//   zeroForOne; // to stop ts from complaining; remove later
//   exactAmount; // to stop ts from complaining; remove later
//   hookData; // to stop ts from complaining; remove later

//   // TODO: get Quoter lens ABI
//   // TODO: encode the call
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// // TODO: not sure how to calculate this yet
// export function encodeQuoteAheadParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>, epochsAhead: number): MethodParameters {
//   const zeroForOne = poolKey.currency0 === tokenInAmount.currency.address;
//   const exactAmount = tokenInAmount.toExact(); // needs to convert to uint128
//   const hookData = '0x';

//   zeroForOne; // to stop ts from complaining; remove later
//   exactAmount; // to stop ts from complaining; remove later
//   hookData; // to stop ts from complaining; remove later
//   epochsAhead; // to stop ts from complaining; remove later
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// export function encodeSwapParams(poolKey: PoolKey, tokenInAmount: CurrencyAmount<Token>, tokenOutAmount: CurrencyAmount<Token>): MethodParameters {
//   poolKey; // to stop ts from complaining; remove later
//   tokenInAmount; // to stop ts from complaining; remove later
//   tokenOutAmount; // to stop ts from complaining; remove later

//   // TODO: get SwapRouter (or Universal Router)ABI
//   // TODO: encode the call using router sdk
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// export function encodeTotalTokensSold(poolKey: PoolKey): MethodParameters {
//   const hookAddress = poolKey.hooks;
//   hookAddress; // to stop ts from complaining; remove later
//   // get hook abi
//   // encode function to call state.totalTokensSold
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }

// export function encodeTotalProceeds(poolKey: PoolKey): MethodParameters {
//   const hookAddress = poolKey.hooks;
//   hookAddress; // to stop ts from complaining; remove later
//   // get hook abi
//   // encode function to call state.totalProceeds
//   return {
//     calldata: '0x',
//     value: '0x',
//   };
// }
