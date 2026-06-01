'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  fetchFollowing,
  followUser,
  getFollowers,
  getFollowing,
  getFollowingFeed,
  unfollowUser,
  type FetchFollowListOptions,
  type FetchFollowingFeedOptions,
  type FollowListPage,
  type FollowProfile,
  type FollowUserResult,
  type FollowingResponse,
} from '../fetchers/follow.js';
import type { FollowFeedPage } from '../../schemas/feed.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Legacy "people I follow" query. Kept as-is for back-compat with sifa-web
 * call sites that pre-date the V5 feed work. New code should use
 * {@link useFollowingList} (paginated per-profile) or
 * {@link useFollowingFeed} (V5 feed).
 */
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

/** Variables for {@link useFollow}. */
export interface FollowVariables {
  handle: string;
  /** Server-resolved DID of the subject, when known. Used for optimistic cache writes. */
  subjectDid?: string;
  /** Optional Sifa-only "why I followed" note (max 200 graphemes). */
  note?: string;
}

/** Variables for {@link useUnfollow}. */
export interface UnfollowVariables {
  handle: string;
}

/**
 * Mutation hook for following a handle. Optimistically marks the
 * follow-state cache as `true` and rolls back on failure (per
 * sifa-api#673 TR8 / iter-1 plan TR8). Invalidates the followers /
 * following lists and the V5 feed on success so they refetch.
 *
 * Optimistic cache entry: `sifaQueryKeys.follow.followers(handle)`
 * receives the viewer prepended to the list shape; the optimistic update
 * is intentionally conservative — it only flips per-handle state and
 * doesn't try to invent rich `FollowProfile` fields.
 */
export function useFollow(
  options?: Omit<UseMutationOptions<FollowUserResult, Error, FollowVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ handle, note }: FollowVariables) => followUser(config, handle, { note }),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.follow.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      // Rollback: refetch the affected lists so stale optimistic state is reset.
      await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.follow.all() });
      await options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
}

/**
 * Mutation hook for unfollowing a handle. Optimistic + rollback mirror
 * of {@link useFollow}.
 */
export function useUnfollow(
  options?: Omit<UseMutationOptions<WriteResult, Error, UnfollowVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ handle }: UnfollowVariables) => unfollowUser(config, handle),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.follow.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.follow.all() });
      await options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Infinite-query hook for `handle`'s followers list. */
export function useFollowers(
  handle: string,
  opts: Omit<FetchFollowListOptions, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      FollowListPage,
      Error,
      InfiniteData<FollowListPage>,
      ReturnType<typeof sifaQueryKeys.follow.followers>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const config = useSifaConfig();
  return useInfiniteQuery({
    queryKey: sifaQueryKeys.follow.followers(handle),
    queryFn: ({ pageParam }) => getFollowers(config, handle, { ...opts, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FollowListPage) => lastPage.cursor ?? undefined,
    enabled: handle.length > 0,
    ...options,
  });
}

/** Infinite-query hook for who `handle` follows. */
export function useFollowingList(
  handle: string,
  opts: Omit<FetchFollowListOptions, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      FollowListPage,
      Error,
      InfiniteData<FollowListPage>,
      ReturnType<typeof sifaQueryKeys.follow.followingOf>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const config = useSifaConfig();
  return useInfiniteQuery({
    queryKey: sifaQueryKeys.follow.followingOf(handle),
    queryFn: ({ pageParam }) => getFollowing(config, handle, { ...opts, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FollowListPage) => lastPage.cursor ?? undefined,
    enabled: handle.length > 0,
    ...options,
  });
}

/** Infinite-query hook for the V5 home feed (authenticated viewer). */
export function useFollowingFeed(
  opts: Omit<FetchFollowingFeedOptions, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      FollowFeedPage,
      Error,
      InfiniteData<FollowFeedPage>,
      ReturnType<typeof sifaQueryKeys.follow.feed>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const config = useSifaConfig();
  // Drop AbortSignal/fetch-only fields from the key so cache identity stays stable across renders.
  const keyOpts: Record<string, unknown> = {
    limit: opts.limit,
    categories: opts.categories,
  };
  return useInfiniteQuery({
    queryKey: sifaQueryKeys.follow.feed(keyOpts),
    queryFn: ({ pageParam }) => getFollowingFeed(config, { ...opts, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FollowFeedPage) => lastPage.cursor ?? undefined,
    ...options,
  });
}

// Re-export for convenience so consumers only need one import path for the type.
export type { FollowProfile };
