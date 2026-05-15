'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchStats, type StatsResponse } from '../fetchers/stats.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook for the public homepage stats. Returns `null` data on error.
 */
export function useStats(
  options?: Omit<
    UseQueryOptions<
      StatsResponse | null,
      Error,
      StatsResponse | null,
      ReturnType<typeof sifaQueryKeys.stats.homepage>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.stats.homepage(),
    queryFn: () => fetchStats(config),
    ...options,
  });
}
