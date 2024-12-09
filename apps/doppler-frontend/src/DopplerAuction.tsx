import { usePublicClient } from 'wagmi';
import { ReadDoppler } from 'doppler-sdk';
import { Drift } from '@delvtech/drift';
import { viemAdapter } from '@delvtech/drift-viem';
import { Address } from 'viem';
import { useMemo } from 'react';

export function useDoppler(dopplerAddress: Address, stateViewAddress: Address) {
  const publicClient = usePublicClient();

  return useMemo(() => {
    const drift = new Drift({
      adapter: viemAdapter({
        publicClient,
      }),
    });

    return new ReadDoppler(dopplerAddress, stateViewAddress, drift);
  }, [dopplerAddress, stateViewAddress, publicClient]);
}
