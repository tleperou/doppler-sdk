import { Address } from 'viem';
import { DopplerV4Addresses } from './types';

export const DOPPLER_V4_ADDRESSES: { [chainId: number]: DopplerV4Addresses } = {
  // unichain sepolia
  1301: {
    poolManager: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC' as Address,
    airlock: '0x651ab94B4777e2e4cdf96082d90C65bd947b73A4' as Address,
    tokenFactory: '0xC5E5a19a2ee32831Fcb8a81546979AF43936EbaA' as Address,
    dopplerDeployer: '0x8350cAd81149A9944c2fb4276955FaAA7D61e836' as Address,
    v4Initializer: '0x992375478626E67F4e639d3298EbCAaE51C3dF0b' as Address,
    v3Initializer: '0x7Fb9a622186B4660A5988C223ebb9d3690dD5007' as Address,
    governanceFactory: '0x1E4332EEfAE9e4967C2D186f7b2d439D778e81cC' as Address,
    migrator: '0x44C448E38A2C3D206c9132E7f645510dFbBC946b' as Address,
    universalRouter: '0xf70536B3bcC1bD1a972dc186A2cf84cC6da6Be5D' as Address,
    stateView: '0xc199F1072a74D4e905ABa1A84d9a45E2546B6222' as Address,
    v4Quoter: '0x56dcd40a3f2d466f48e7f48bdbe5cc9b92ae4472' as Address,
  },
  84532: {
    poolManager: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as Address,
    airlock: '0xEF8Eb3703f9a4f57D878b2d0e11E661fA9bEA7A8' as Address,
    tokenFactory: '0x2e431386e6f8E4bCf1Afc67208be1B138a75C8b3' as Address,
    dopplerDeployer: '0x6ddfED58D238Ca3195E49d8ac3d4cEa6386E5C33' as Address,
    governanceFactory: '0xa49d460a14646CEc2fE39F9f6290145C81a073B9' as Address,
    v4Initializer: '0xfeEb246fD6798384d2F7b93a206a67E2e67DAf72' as Address,
    migrator: '0x1D8c395e28a11b41384967b2DEDCDc9FF14B3dB3' as Address,
    v3Initializer: '0x4596389b2A8C2EF517B7260C8cfd2e7FEf510965' as Address,
    universalRouter: '0x492e6456d9528771018deb9e87ef7750ef184104' as Address,
    stateView: '0x571291b572ed32ce6751a2cb2486ebee8defb9b4' as Address,
    v4Quoter: '0x0d5e0f971ed27fbff6c2837bf31316121532048d' as Address,
  },
};
