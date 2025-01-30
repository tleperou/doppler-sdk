import { Address } from 'viem';
import { DopplerV4Addresses } from './types';

export const DOPPLER_V4_ADDRESSES: { [chainId: number]: DopplerV4Addresses } = {
  // unichain sepolia
  1301: {
    poolManager: '0x41424637708b95778A2504aeE038C1b3175485A4' as Address,
    airlock: '0x80Fc8e2636B747DECaee2237a762C0C962AEae9F' as Address,
    tokenFactory: '0x2bdB95638a6407A8de2FBD1D975d4a9C255d1516' as Address,
    dopplerDeployer: '0x4e2e5EEA81b7CD991156ee4Cfb173444C95e3f42' as Address,
    v4Initializer: '0x92cAe15a6e6da150a754C0e8c0Abf74b77f6edE5' as Address,
    v3Initializer: '0x4E68836AD67eD8d3C32cb41d977b0c1733bd0885' as Address,
    governanceFactory: '0x4676686F895088FA6F1097db7f3e0c1A23D3a851' as Address,
    migrator: '0xCdF20884d0E4Cbca6E0fE818617F111a4dF21689' as Address,
    universalRouter: '0x5b4566CA3C0ef70544EFfA95CfEf39418286A843' as Address,
    stateView: '0x865d5Fa5512128b3d757472823C6De2b7D09F4ed' as Address,
    basicRouter: '0x2215D2f121BA5ccDcBd1074D1Be30cefb9233f5d' as Address,
  },
};
