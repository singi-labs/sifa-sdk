import type { SkillSuggestion } from '../../types/index.js';
import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Profile entry returned by the search endpoint. */
export interface ProfileSearchResult {
  did?: string;
  handle: string;
  displayName?: string;
  headline?: string;
  avatar?: string;
  about?: string;
  currentRole?: string;
  currentCompany?: string;
  industry?: string;
  domain?: string;
  countryCode?: string;
  locationCountry?: string;
  preferredWorkplace?: string[];
  claimed?: boolean;
  blueskyVerified?: boolean;
  blueskyVerifiedAt?: string | null;
}

export interface SearchFilters {
  q?: string;
  skill?: string;
  country?: string;
  industry?: string;
  domain?: string;
  workplace?: string;
  app?: string;
  /**
   * Open-to filter. Values are short tokens (e.g. "fullTime", "mentor",
   * "collab") matching `OPEN_TO_OPTIONS[].token` from the taxonomy. The
   * API expands tokens to lex values server-side. Multiple tokens are
   * OR-combined (profile matches if any selected token is set).
   */
  openTo?: string[];
  limit?: number;
}

export interface SearchResponse {
  profiles: ProfileSearchResult[];
  total: number;
  limit: number;
  offset: number;
}

/** Skill typeahead suggestion. */
export interface SkillSearchResult {
  name: string;
  slug: string;
  category: string;
  userCount: number;
}

export interface FilterOptions {
  countries: { countryCode: string; country: string; count: number }[];
  industries: { industry: string; count: number }[];
  apps: { appId: string; count: number }[];
  /**
   * Distribution of openTo selections across indexed profiles. Each entry
   * maps a short token (see {@link SearchFilters.openTo}) to the number of
   * profiles that have it set. Omitted from older API responses; treat
   * absence as "no data" rather than "all zero".
   */
  openTo?: { token: string; count: number }[];
}

/** Company entry returned by company search (workspace#299). */
export interface CompanySearchResult {
  /** Immutable catalogue id; the durable `/c/{publicId}` link. */
  publicId: string;
  name: string;
  domain: string | null;
  country: string | null;
  industry: string | null;
  logoUrl: string | null;
  employeeCount: number | null;
}

export interface CompanySearchFilters {
  q?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  industry?: string;
  limit?: number;
}

export interface CompanySearchResponse {
  results: CompanySearchResult[];
  hasMore: boolean;
}

const EMPTY_SEARCH: SearchResponse = { profiles: [], total: 0, limit: 20, offset: 0 };
const EMPTY_FILTERS: FilterOptions = { countries: [], industries: [], apps: [], openTo: [] };
const EMPTY_COMPANY_SEARCH: CompanySearchResponse = { results: [], hasMore: false };

/**
 * Search profiles by free-text query and optional filters. Returns an
 * empty result set when no filters are provided (matching sifa-web's
 * "no input, no fetch" behavior).
 */
export async function fetchSearchProfiles(
  config: SifaApiConfig,
  filters: SearchFilters,
  options: ApiFetchOptions = {},
): Promise<SearchResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.skill) params.set('skill', filters.skill);
  if (filters.country) params.set('country', filters.country);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.domain) params.set('domain', filters.domain);
  if (filters.workplace) params.set('workplace', filters.workplace);
  if (filters.app) params.set('app', filters.app);
  if (filters.openTo && filters.openTo.length > 0) {
    for (const token of filters.openTo) {
      if (token) params.append('openTo', token);
    }
  }
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  if (params.size === 0) return EMPTY_SEARCH;

  return apiFetch<SearchResponse>(config, `/api/search/profiles?${params.toString()}`, {
    cache: 'no-store',
    ...options,
  });
}

/**
 * Company search over the entity catalogue (workspace#299).
 *
 * A category of its own rather than part of profile search: the two rank
 * differently and carry different filters, and a slow category should not hold
 * up the rest of a blended results page.
 *
 * An empty query returns nothing without a network call. The API rejects a
 * blank `q` rather than scanning ~200k rows, so asking would only spend a round
 * trip to be told no.
 */
export async function fetchSearchCompanies(
  config: SifaApiConfig,
  filters: CompanySearchFilters,
  options: ApiFetchOptions = {},
): Promise<CompanySearchResponse> {
  const q = filters.q?.trim();
  if (!q) return EMPTY_COMPANY_SEARCH;

  const params = new URLSearchParams({ q });
  if (filters.country) params.set('country', filters.country);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  return apiFetch<CompanySearchResponse>(config, `/api/search/companies?${params.toString()}`, {
    cache: 'no-store',
    ...options,
  });
}

/**
 * Skill typeahead. Returns up to 8 matches for the given prefix. Empty
 * input returns an empty array without hitting the server.
 */
export async function fetchSkillSuggestions(
  config: SifaApiConfig,
  query: string,
  options: ApiFetchOptions = {},
): Promise<SkillSearchResult[]> {
  if (!query.trim()) return [];
  const path = `/api/search/skills?q=${encodeURIComponent(query)}&limit=8`;
  const data = await apiFetch<{ skills?: SkillSearchResult[] }>(config, path, {
    cache: 'no-store',
    ...options,
  });
  return data.skills ?? [];
}

/** Available filter facets (countries, industries, apps) for search UI. */
export async function fetchSearchFilters(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<FilterOptions> {
  try {
    return await apiFetch<FilterOptions>(config, '/api/search/filters', {
      next: { revalidate: 300 },
      ...options,
    });
  } catch {
    return EMPTY_FILTERS;
  }
}

/**
 * Canonical-skill search backing the position-editor and similar
 * skill-pickers. Hits `/api/skills/search` (the canonical-skills DB
 * lookup) which is distinct from {@link fetchSkillSuggestions}'s
 * `/api/search/skills` (the profile-skill typeahead).
 *
 * Returns `[]` on empty input (no network call) or any error.
 */
export async function searchSkills(
  config: SifaApiConfig,
  query: string,
  limit = 10,
  options: ApiFetchOptions = {},
): Promise<SkillSuggestion[]> {
  if (!query.trim()) return [];
  const path = `/api/skills/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  try {
    const data = await apiFetch<{ skills?: SkillSuggestion[] }>(config, path, {
      cache: 'no-store',
      ...options,
    });
    return data.skills ?? [];
  } catch {
    return [];
  }
}
