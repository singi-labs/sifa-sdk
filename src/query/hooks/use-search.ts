'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type { SkillSuggestion } from '../../types/index.js';
import { useSifaConfig } from '../config.js';
import {
  fetchSearchCompanies,
  fetchSearchFilters,
  fetchSearchProfiles,
  fetchSkillSuggestions,
  searchSkills,
  type CompanySearchFilters,
  type CompanySearchResponse,
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

/**
 * Canonical-skill search hook. Hits `/api/skills/search` (the
 * canonical-skills DB lookup, distinct from {@link useSkillSuggestions}'s
 * `/api/search/skills` profile-skill typeahead). Skips the network call
 * when the query is empty.
 */
export function useCanonicalSkillSearch(
  query: string,
  limit = 10,
  options?: Omit<
    UseQueryOptions<
      SkillSuggestion[],
      Error,
      SkillSuggestion[],
      ReturnType<typeof sifaQueryKeys.search.canonicalSkills>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.search.canonicalSkills(query, limit),
    queryFn: () => searchSkills(config, query, limit),
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

/**
 * Company search (workspace#299). Separate hook from `useSearchProfiles` so a
 * blended results page can render each category as it resolves instead of
 * waiting for the slowest.
 */
export function useSearchCompanies(
  filters: CompanySearchFilters,
  options?: Omit<
    UseQueryOptions<
      CompanySearchResponse,
      Error,
      CompanySearchResponse,
      ReturnType<typeof sifaQueryKeys.search.companies>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.search.companies(filters as Record<string, unknown>),
    queryFn: () => fetchSearchCompanies(config, filters),
    ...options,
  });
}
