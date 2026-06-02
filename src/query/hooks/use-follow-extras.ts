'use client';

import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  getBlueskySuggestions,
  getMutuals,
  type FetchFollowProfilePageOptions,
  type FollowProfilePageResponse,
} from '../fetchers/follow-extras.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Infinite-query hook for the mutuals list of `handleOrDid`. Backed by
 * {@link getMutuals} (`GET /api/profile/{handleOrDid}/mutuals`). Disabled
 * when `handleOrDid` is empty so component-mount with a lazy handle doesn't
 * fire a wasted request.
 */
export function useMutuals(
  handleOrDid: string,
  opts: Omit<FetchFollowProfilePageOptions, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      FollowProfilePageResponse,
      Error,
      InfiniteData<FollowProfilePageResponse>,
      ReturnType<typeof sifaQueryKeys.follow.mutuals>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const config = useSifaConfig();
  return useInfiniteQuery({
    queryKey: sifaQueryKeys.follow.mutuals(handleOrDid),
    queryFn: ({ pageParam }) => getMutuals(config, handleOrDid, { ...opts, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FollowProfilePageResponse) => lastPage.cursor ?? undefined,
    enabled: handleOrDid.length > 0,
    ...options,
  });
}

/**
 * Infinite-query hook for the authenticated viewer's Bluesky-follow
 * suggestions (people the viewer follows on Bluesky but not Sifa).
 * Backed by {@link getBlueskySuggestions}.
 */
export function useBlueskySuggestions(
  opts: Omit<FetchFollowProfilePageOptions, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      FollowProfilePageResponse,
      Error,
      InfiniteData<FollowProfilePageResponse>,
      ReturnType<typeof sifaQueryKeys.follow.blueskySuggestions>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const config = useSifaConfig();
  return useInfiniteQuery({
    queryKey: sifaQueryKeys.follow.blueskySuggestions(),
    queryFn: ({ pageParam }) => getBlueskySuggestions(config, { ...opts, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FollowProfilePageResponse) => lastPage.cursor ?? undefined,
    ...options,
  });
}
