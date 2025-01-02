import { Address } from 'viem';
import { DopplerAddresses } from './types';

export const DOPPLER_ADDRESSES: { [chainId: number]: DopplerAddresses } = {
  // unichain sepolia
  1301: {
    airlock: '0xE2CA693934b3e78E9bF3762420f1a8B7404B43BF' as Address,
    tokenFactory: '0xC8CaB2f808337d8558d2fE15a21F5e684Af7Acfc' as Address,
    v3Initializer: '0x3E0C00B577F5faE8b946da634feB4346054B51C6' as Address,
    governanceFactory: '0x1c2E5AA6AcE468c3Ac76c4A37466E2170Cb2D459' as Address,
    liquidityMigrator: '0xD1EE7D1148661d3E985f3CfDa894a1E04f8cDfD8' as Address,
  },
};
