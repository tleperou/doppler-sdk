import {
  Address,
  Hash,
  keccak256,
  encodeAbiParameters,
  encodePacked,
  getAddress,
  fromHex,
  Hex,
} from 'viem';
import { DopplerBytecode } from '../abis/DopplerABI';
import { DERC20Bytecode } from '../abis/DERC20ABI';

const FLAG_MASK = BigInt(0x3fff);

const flags = BigInt(
  (1 << 13) | // BEFORE_INITIALIZE_FLAG
  (1 << 12) | // AFTER_INITIALIZE_FLAG
  (1 << 11) | // BEFORE_ADD_LIQUIDITY_FLAG
  (1 << 7) | // BEFORE_SWAP_FLAG
    (1 << 6) // AFTER_SWAP_FLAG
);

export interface MineParams {
  poolManager: Address;
  numTokensToSell: bigint;
  minTick: number;
  maxTick: number;
  airlock: Address;
  name: string;
  symbol: string;
  initialSupply: bigint;
  numeraire: Address;
  startingTime: bigint;
  endingTime: bigint;
  minimumProceeds: bigint;
  maximumProceeds: bigint;
  epochLength: bigint;
  gamma: number;
  numPDSlugs: bigint;
}

function computeCreate2Address(
  salt: Hash,
  initCodeHash: Hash,
  deployer: Address
): Address {
  const encoded = encodePacked(
    ['bytes1', 'address', 'bytes32', 'bytes32'],
    ['0xff', deployer, salt, initCodeHash]
  );
  return getAddress(`0x${keccak256(encoded).slice(-40)}`);
}

export function mine(
  tokenFactory: Address,
  hookFactory: Address,
  params: MineParams
): [Hash, Address, Address] {
  const isToken0 =
    params.numeraire !== '0x0000000000000000000000000000000000000000';
  console.log('flags', flags);

  console.log('params.numeraire', params.numeraire);
  console.log('params.poolManager', params.poolManager);
  console.log('params.numTokensToSell', params.numTokensToSell);
  console.log('params.minimumProceeds', params.minimumProceeds);
  console.log('params.maximumProceeds', params.maximumProceeds);
  console.log('params.startingTime', params.startingTime);
  console.log('params.endingTime', params.endingTime);
  console.log('params.minTick', params.minTick);
  console.log('params.maxTick', params.maxTick);
  console.log('params.epochLength', params.epochLength);
  console.log('params.gamma', params.gamma);
  console.log('isToken0', isToken0);
  console.log('params.numPDSlugs', params.numPDSlugs);
  console.log('params.airlock', params.airlock);

  const hookInitHash = keccak256(
    encodePacked(
      ['bytes', 'bytes'],
      [
        DopplerBytecode.object as Hex,
        encodeAbiParameters(
          [
            { type: 'address' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'int24' },
            { type: 'int24' },
            { type: 'uint256' },
            { type: 'int24' },
            { type: 'bool' },
            { type: 'uint256' },
            { type: 'address' },
          ],
          [
            params.poolManager,
            params.numTokensToSell,
            params.minimumProceeds,
            params.maximumProceeds,
            params.startingTime,
            params.endingTime,
            params.minTick,
            params.maxTick,
            params.epochLength,
            params.gamma,
            isToken0,
            params.numPDSlugs,
            params.airlock,
          ]
        ),
      ]
    )
  );

  const tokenInitHash = keccak256(
    encodePacked(
      ['bytes', 'bytes'],
      [
        DERC20Bytecode.object as Hex,
        encodeAbiParameters(
          [
            { type: 'string' },
            { type: 'string' },
            { type: 'uint256' },
            { type: 'address' },
            { type: 'address' },
          ],
          [
            params.name,
            params.symbol,
            params.initialSupply,
            params.airlock,
            params.airlock,
          ]
        ),
      ]
    )
  );
  for (let salt = BigInt(0); salt < BigInt(1_000_000); salt++) {
    const saltBytes = `0x${salt.toString(16).padStart(64, '0')}` as Hash;
    const hook = computeCreate2Address(saltBytes, hookInitHash, hookFactory);
    const token = computeCreate2Address(saltBytes, tokenInitHash, tokenFactory);
    console.log('hook', hook);
    console.log('token', token);

    const hookBigInt = BigInt(hook);
    const tokenBigInt = BigInt(token);
    const numeraireBigInt = BigInt(params.numeraire);

    if (
      (hookBigInt & FLAG_MASK) === flags &&
      ((isToken0 && tokenBigInt < numeraireBigInt) ||
        (!isToken0 && tokenBigInt > numeraireBigInt))
    ) {
      console.log('found');
      console.log('hookInitHash', hookInitHash);
      console.log('tokenInitHash', tokenInitHash);
      console.log('hook', hook);
      console.log('token', token);
      return [saltBytes, hook, token];
    }
  }

  throw new Error('AirlockMiner: could not find salt');
}
