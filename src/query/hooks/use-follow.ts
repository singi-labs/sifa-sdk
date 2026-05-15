'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchFollowing, type FollowingResponse } from '../fetchers/follow.js';
import { sifaQueryKeys } from '../keys.js';

export function useFollowing(
  opts: { source?: string; cursor?: string; limit?: number } = {},
  options?: Omit<
    UseQueryOptions<
      FollowingResponse,
      Error,
      FollowingResponse,
      ReturnType<typeof sifaQueryKeys.follow.following>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.follow.following(opts as Record<string, unknown>),
    queryFn: () => fetchFollowing(config, opts),
    ...options,
  });
}
