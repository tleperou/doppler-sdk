import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // unichain sepolia
  1301: {
    airlock: '0x53dd5d05b440513f2565e4b372e1cdedb6c4b0a9' as Address,
    tokenFactory: '0x92e5c7d5152d9c8a0f193f71ec8f24332cb58f14' as Address,
    uniswapV4Initializer:
      '0x41f903609386c621c29a9d86dad097ae3e13d4a5' as Address,
    uniswapV3Initializer:
      '0xd6616fceb1501efb4f9b2de0180cfd8766ea7c80' as Address,
    governanceFactory: '0xd6616fceb1501efb4f9b2de0180cfd8766ea7c80' as Address,
    liquidityMigrator: '0x5acf6e39a0a351c32202403bef0a93215f742fc0' as Address,
    stateView: '0xdE04C804dc75E90D8a64e5589092a1D6692EFA45' as Address,
    quoter: '0xfe6Cf50c4cfe801dd2AEf9c1B3ce24f551944df8' as Address,
    customRouter: '0x335101dfaeFaA13eded1212Fd120376411d22788' as Address,
    poolManager: '0xC81462Fec8B23319F288047f8A03A57682a35C1A' as Address,
  },
};
