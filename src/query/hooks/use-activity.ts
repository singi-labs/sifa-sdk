'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchActivityFeed,
  fetchActivityTeaser,
  fetchHeatmapData,
  type ActivityFeedResponse,
  type ActivityTeaserResponse,
  type FetchActivityFeedOptions,
  type HeatmapResponse,
} from '../fetchers/activity.js';
import { sifaQueryKeys } from '../keys.js';

export function useHeatmapData(
  handleOrDid: string | undefined | null,
  days: number,
  options?: Omit<
    UseQueryOptions<
      HeatmapResponse | null,
      Error,
      HeatmapResponse | null,
      ReturnType<typeof sifaQueryKeys.activity.heatmap>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.heatmap(handleOrDid ?? '', days),
    queryFn: () => fetchHeatmapData(config, handleOrDid ?? '', days),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}

export function useActivityTeaser(
  handleOrDid: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      ActivityTeaserResponse | null,
      Error,
      ActivityTeaserResponse | null,
      ReturnType<typeof sifaQueryKeys.activity.teaser>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.teaser(handleOrDid ?? ''),
    queryFn: () => fetchActivityTeaser(config, handleOrDid ?? ''),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}

export function useActivityFeed(
  handleOrDid: string | undefined | null,
  opts: Pick<FetchActivityFeedOptions, 'category' | 'limit' | 'cursor'> = {},
  options?: Omit<
    UseQueryOptions<
      ActivityFeedResponse | null,
      Error,
      ActivityFeedResponse | null,
      ReturnType<typeof sifaQueryKeys.activity.feed>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.feed(handleOrDid ?? '', opts as Record<string, unknown>),
    queryFn: () => fetchActivityFeed(config, handleOrDid ?? '', opts),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}
