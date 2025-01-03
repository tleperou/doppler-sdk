import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // unichain sepolia
  1301: {
    airlock: '0x0ec7a97c0bf6cb52c882e23ae66fbd3a914989f5' as Address,
    tokenFactory: '0xbFDB42D11705c21B2C5b9358ae2BB1DF6fc4E828' as Address,
    v3Initializer: '0xA6b6d0465A88DC1674b68d75DC5d2b8B8D36daE5' as Address,
    governanceFactory: '0x7bdA8541cecb830fd3b29433A59c8c1de2DFE929' as Address,
    liquidityMigrator: '0x3b5660fAD6A586c06CBd32a138A423F25cE4a8F9' as Address,
  },
};
