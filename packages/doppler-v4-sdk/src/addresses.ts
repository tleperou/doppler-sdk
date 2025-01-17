import { Address } from 'viem';
import { DopplerV4Addresses } from './types';

export const DOPPLER_V4_ADDRESSES: { [chainId: number]: DopplerV4Addresses } = {
  // unichain sepolia
  1301: {
    uniRouter: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C' as Address,
    poolManager: '0x6d8d65e227882Cc9134d28125Fe07047f357f5A6' as Address,
    airlock: '0x794cCd26eEdE286010Dd9CDBf78F84Cc8149155f' as Address,
    tokenFactory: '0xA67BEB0c483CD2be89A14f09AE9130dDc9eE1914' as Address,
    dopplerDeployer: '0x55965C8DDa8D3E5c1C983b63B06352128CE23F60' as Address,
    v4Initializer: '0xCDdD09b7e210b7BC50E9FCD965b4BF3a20b2672A' as Address,
    v3Initializer: '0xa76cE49631Ed3139E7e6230E2bd2578934f55D43' as Address,
    governanceFactory: '0xe358627490365763BB925F46641d0b1E43f4f2D3' as Address,
    migrator: '0xe18979dE1f896A951928a45555EbcBE61d77a7b3' as Address,
    stateView: '0xdE04C804dc75E90D8a64e5589092a1D6692EFA45' as Address,
    quoter: '0xfe6Cf50c4cfe801dd2AEf9c1B3ce24f551944df8' as Address,
    customRouter: '0x3f6C921872447eFAfd5c0b7F3B1C20e17e5e2b50' as Address,
  },
};
