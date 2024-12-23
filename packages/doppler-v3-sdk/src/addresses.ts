import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // unichain sepolia
  1301: {
    airlock: '0x576D00aA95110A6bc9914491015757549b3b974e' as Address,
    tokenFactory: '0x547C314Aa1E82978aC3a1AA83Ce7a12BBbD94204' as Address,
    v3Initializer: '0xC3504da42F605F3cA5A5bED34F3b79F1b33494e5' as Address,
    governanceFactory: '0xfb614B2B4C2C20fAfedE1F901e9DeDe764eB7e35' as Address,
    liquidityMigrator: '0x35638289d125358852272A4da494b736E581d9bb' as Address,
  },
};
