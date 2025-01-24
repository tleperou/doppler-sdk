import { Address } from 'viem';
import { DopplerV3Addresses } from './types';

export const DOPPLER_V3_ADDRESSES: { [chainId: number]: DopplerV3Addresses } = {
  // unichain sepolia
  1301: {
    airlock: '0x69224c3523999331E01C8B7d1DCc295343CEE26a' as Address,
    tokenFactory: '0xaF7333D5B1D12170867078ed84387B9dD3B33d67' as Address,
    v3Initializer: '0x003CaB286014EB585363ab2661dDC1307aE1E977' as Address,
    governanceFactory: '0xd0DE88aff74eC9D52A3e4F565844fDE378386BaA' as Address,
    liquidityMigrator: '0x76309FA8c4D006aa50b5E3417cfca395BBf9B50A' as Address,
    universalRouter: '0xAD5D299658872f5FD917356cC1af752E6526F441' as Address,
    basicRouter: '0x2215D2f121BA5ccDcBd1074D1Be30cefb9233f5d' as Address,
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address,
  },
};
