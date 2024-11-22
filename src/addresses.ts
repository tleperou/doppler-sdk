import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // sepolia placeholder
  11155111: {
    airlock: '0x...' as Address,
    tokenFactory: '0x...' as Address,
    dopplerFactory: '0x...' as Address,
    governanceFactory: '0x...' as Address,
    migrator: '0x...' as Address,
    poolManager: '0x...' as Address,
    stateView: '0x...' as Address,
    customRouter: '0x...' as Address,
  },
};
