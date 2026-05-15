'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchMyRoadmapVotes,
  fetchRoadmapVotes,
  type RoadmapVotesResponse,
} from '../fetchers/roadmap.js';
import { sifaQueryKeys } from '../keys.js';

/** Public roadmap vote tallies. Returns `{}` data on error. */
export function useRoadmapVotes(
  options?: Omit<
    UseQueryOptions<
      RoadmapVotesResponse,
      Error,
      RoadmapVotesResponse,
      ReturnType<typeof sifaQueryKeys.roadmap.votes>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.roadmap.votes(),
    queryFn: () => fetchRoadmapVotes(config),
    ...options,
  });
}

/** Roadmap items the authenticated viewer has voted on. Returns `[]` data on error. */
export function useMyRoadmapVotes(
  options?: Omit<
    UseQueryOptions<string[], Error, string[], ReturnType<typeof sifaQueryKeys.roadmap.myVotes>>,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.roadmap.myVotes(),
    queryFn: () => fetchMyRoadmapVotes(config),
    ...options,
  });
}
