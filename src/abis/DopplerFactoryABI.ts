import { Abi } from 'viem';
export const DopplerFactoryABI: Abi = [
  {
    type: 'function',
    name: 'create',
    inputs: [
      {
        name: 'poolManager',
        type: 'address',
        internalType: 'contract IPoolManager',
      },
      { name: 'numTokensToSell', type: 'uint256', internalType: 'uint256' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
      { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
];
