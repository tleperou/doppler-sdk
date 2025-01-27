import { Address, Hex } from 'viem';

const FEE_SIZE = 3;
const FEE_TIER = 3000;

export class SwapRouter02Encoder {
  encodePath(path: Address[]): Hex {
    let encoded = '0x';
    for (let i = 0; i < path.length - 1; i++) {
      encoded += path[i].slice(2);
      encoded += FEE_TIER.toString(16).padStart(2 * FEE_SIZE, '0');
    }
    encoded += path[path.length - 1].slice(2);

    return encoded.toLowerCase() as Hex;
  }

  encodePathExactInput(tokens: Address[]): Hex {
    return this.encodePath(tokens);
  }

  encodePathExactOutput(tokens: Address[]): Hex {
    return this.encodePath(tokens.slice().reverse());
  }
}
