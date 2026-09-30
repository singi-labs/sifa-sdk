'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchVerificationLog, type VerificationLog } from '../fetchers/verification.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * The verification log of one position. Returns an empty log on error, so a
 * panel can render "no verification yet" without special-casing failure.
 */
export function useVerificationLog(
  did: string,
  positionRkey: string,
  options?: Omit<
    UseQueryOptions<
      VerificationLog,
      Error,
      VerificationLog,
      ReturnType<typeof sifaQueryKeys.verification.log>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.verification.log(did, positionRkey),
    queryFn: () => fetchVerificationLog(config, did, positionRkey),
    ...options,
  });
}
