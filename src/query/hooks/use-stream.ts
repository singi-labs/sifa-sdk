'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchNetworkStreamCount } from '../fetchers/stream.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Count of items in the authenticated user's network stream digest.
 * Returns 0 on error (including when the endpoint isn't yet shipped).
 */
export function useNetworkStreamCount(
  did: string | undefined | null,
  options?: Omit<
    UseQueryOptions<number, Error, number, ReturnType<typeof sifaQueryKeys.stream.networkCount>>,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.stream.networkCount(did ?? ''),
    queryFn: () => fetchNetworkStreamCount(config, did ?? ''),
    enabled: Boolean(did) && (options?.enabled ?? true),
    ...options,
  });
}
