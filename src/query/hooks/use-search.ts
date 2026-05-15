'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchSearchFilters,
  fetchSearchProfiles,
  fetchSkillSuggestions,
  type FilterOptions,
  type SearchFilters,
  type SearchResponse,
  type SkillSearchResult,
} from '../fetchers/search.js';
import { sifaQueryKeys } from '../keys.js';

export function useSearchProfiles(
  filters: SearchFilters,
  options?: Omit<
    UseQueryOptions<
      SearchResponse,
      Error,
      SearchResponse,
      ReturnType<typeof sifaQueryKeys.search.profiles>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.search.profiles(filters as Record<string, unknown>),
    queryFn: () => fetchSearchProfiles(config, filters),
    ...options,
  });
}

export function useSkillSuggestions(
  query: string,
  options?: Omit<
    UseQueryOptions<
      SkillSearchResult[],
      Error,
      SkillSearchResult[],
      ReturnType<typeof sifaQueryKeys.search.skills>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.search.skills(query),
    queryFn: () => fetchSkillSuggestions(config, query),
    enabled: query.trim().length > 0 && (options?.enabled ?? true),
    ...options,
  });
}

export function useSearchFilters(
  options?: Omit<
    UseQueryOptions<
      FilterOptions,
      Error,
      FilterOptions,
      ReturnType<typeof sifaQueryKeys.search.filters>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.search.filters(),
    queryFn: () => fetchSearchFilters(config),
    ...options,
  });
}
