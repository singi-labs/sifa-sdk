'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchEndorsementCount } from '../fetchers/endorsement.js';
import { sifaQueryKeys } from '../keys.js';

/** Count of confirmed endorsements for a DID. Returns 0 on error. */
export function useEndorsementCount(
  did: string | undefined | null,
  options?: Omit<
    UseQueryOptions<number, Error, number, ReturnType<typeof sifaQueryKeys.endorsement.count>>,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.endorsement.count(did ?? ''),
    queryFn: () => fetchEndorsementCount(config, did ?? ''),
    enabled: Boolean(did) && (options?.enabled ?? true),
    ...options,
  });
}
