import { Address } from 'viem';
import { DopplerV4Addresses } from './types';

export const DOPPLER_V4_ADDRESSES: { [chainId: number]: DopplerV4Addresses } = {
  // unichain sepolia
  1301: {
    poolManager: '0x6606209a59B01C4A782eB112d8f4B05c5cB1AE21' as Address,
    airlock: '0xD2fAf44Ac804d5b88d4993aABc2DE4d1bb13603c' as Address,
    tokenFactory: '0x192b44154224fE9c4f1Ed797A48987052296046f' as Address,
    dopplerDeployer: '0x2Eb9732A0bCb5f3916be52C7422F8ACB4a311999' as Address,
    v4Initializer: '0x7422b7EF96457752b588d16Acaba099114cc6B87' as Address,
    v3Initializer: '0x58760A5928507d99Ebd42B527D3CF2Ea85846222' as Address,
    governanceFactory: '0x180566a3EeF896886DEEa69036a9ACFF70d8304c' as Address,
    migrator: '0xA7D5D11ba18a1967f68729eb7F4A8504dA491BFa' as Address,
    universalRouter: '0x6638Fe1D3cDc04782984d0A06e2a7C19f7090Ccf' as Address,
    basicRouter: '0x4C2774e6a9d60300e10955007a15c0CFfcDc8bD2' as Address,
  },
};
