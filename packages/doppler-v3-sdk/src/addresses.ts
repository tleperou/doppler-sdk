import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // unichain sepolia
  1301: {
    dopplerFactory: '0x4c5859f0f772848b2d91f1d83e2fe57935348029' as Address,
    airlock: '0x379543D196F9ea360084bb61f424780d7E7eBEC3' as Address,
    tokenFactory: '0xC87Dd16242545C0BBa03bA8d36AFaC6B5d566b4e' as Address,
    v3Initializer: '0x06d0fd396c59401c68aD3E363De845fE61DFA6A9' as Address,
    governanceFactory: '0xa4E1915bBe3C09EeC16916b880773E5af58b2578' as Address,
    migrator: '0xFC9b263ec6509adBc8aDF185ab40643737372927' as Address,
  },
};
