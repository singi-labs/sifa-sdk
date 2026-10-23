'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  castRoadmapItemVote,
  retractRoadmapItemVote,
  type CastRoadmapVoteResult,
  type RoadmapItemRef,
} from '../fetchers/roadmap.js';

/**
 * React hook for voting on a roadmap board item. Variable: the item's
 * `{ did, rkey }`. Returns the discriminated-union result so callers can
 * detect `scope_insufficient` and trigger an OAuth scope-upgrade flow.
 *
 * Board data from `fetchRoadmap` is not held in the query cache, so nothing is
 * invalidated here: keep optimistic local state or call `router.refresh()`.
 * Voting twice is safe; the API answers 200.
 */
export function useCastRoadmapItemVote(
  options?: Omit<UseMutationOptions<CastRoadmapVoteResult, Error, RoadmapItemRef>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  return useMutation({
    ...options,
    mutationFn: (item: RoadmapItemRef) => castRoadmapItemVote(config, item),
  });
}

/** React hook for retracting a vote on a roadmap board item. */
export function useRetractRoadmapItemVote(
  options?: Omit<UseMutationOptions<WriteResult, Error, RoadmapItemRef>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  return useMutation({
    ...options,
    mutationFn: (item: RoadmapItemRef) => retractRoadmapItemVote(config, item),
  });
}
