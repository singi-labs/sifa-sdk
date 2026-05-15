'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchFeaturedProfile,
  fetchSimilarProfiles,
  fetchSuggestionCount,
  fetchSuggestions,
  type FeaturedProfile,
  type FetchSuggestionsOptions,
  type SimilarProfile,
  type SuggestionsResponse,
} from '../fetchers/discovery.js';
import { sifaQueryKeys } from '../keys.js';

export function useSimilarProfiles(
  did: string | undefined | null,
  opts: { limit?: number } = {},
  options?: Omit<
    UseQueryOptions<
      SimilarProfile[],
      Error,
      SimilarProfile[],
      ReturnType<typeof sifaQueryKeys.discovery.similar>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  const limit = opts.limit ?? 5;
  return useQuery({
    queryKey: sifaQueryKeys.discovery.similar(did ?? '', limit),
    queryFn: () => fetchSimilarProfiles(config, did ?? '', { limit }),
    enabled: Boolean(did) && (options?.enabled ?? true),
    ...options,
  });
}

export function useSuggestions(
  opts: Omit<
    FetchSuggestionsOptions,
    keyof Omit<FetchSuggestionsOptions, 'source' | 'includeDismissed' | 'cursor' | 'limit'>
  > = {},
  options?: Omit<
    UseQueryOptions<
      SuggestionsResponse,
      Error,
      SuggestionsResponse,
      ReturnType<typeof sifaQueryKeys.discovery.suggestions>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.discovery.suggestions(opts as Record<string, unknown>),
    queryFn: () => fetchSuggestions(config, opts),
    ...options,
  });
}

export function useSuggestionCount(
  since?: string,
  options?: Omit<
    UseQueryOptions<
      number,
      Error,
      number,
      ReturnType<typeof sifaQueryKeys.discovery.suggestionCount>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.discovery.suggestionCount(since),
    queryFn: () => fetchSuggestionCount(config, since),
    ...options,
  });
}

export function useFeaturedProfile(
  options?: Omit<
    UseQueryOptions<
      FeaturedProfile | null,
      Error,
      FeaturedProfile | null,
      ReturnType<typeof sifaQueryKeys.discovery.featured>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.discovery.featured(),
    queryFn: () => fetchFeaturedProfile(config),
    ...options,
  });
}
