'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchReceivedEndorsements,
  type ReceivedEndorsementsPage,
} from '../fetchers/received-endorsements.js';
import { sifaQueryKeys } from '../keys.js';

/** Confirmed endorsements a DID has received, newest first. */
export function useReceivedEndorsements(
  did: string | undefined | null,
  options?: { limit?: number } & Omit<
    UseQueryOptions<
      ReceivedEndorsementsPage,
      Error,
      ReceivedEndorsementsPage,
      ReturnType<typeof sifaQueryKeys.endorsement.received>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  const { limit, ...queryOptions } = options ?? {};
  return useQuery({
    queryKey: sifaQueryKeys.endorsement.received(did ?? ''),
    queryFn: () => fetchReceivedEndorsements(config, did ?? '', { limit }),
    enabled: Boolean(did) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}
