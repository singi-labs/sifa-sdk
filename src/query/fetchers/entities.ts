import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';
import {
  EntitySearchResponseSchema,
  EntitySelectResponseSchema,
  EntityImportSearchResponseSchema,
  EntityResolveDomainResponseSchema,
  EntityMintDomainResponseSchema,
  type EntitySearchResponse,
  type EntitySearchResult,
  type EntitySelectRequest,
  type EntitySelectResponse,
  type EntityResolveDomainResponse,
  type EntityMintDomainResponse,
} from '../../schemas/entity.js';

const EMPTY_SEARCH: EntitySearchResponse = { results: [], hasMore: false };

/**
 * Organization typeahead. Returns curated entities first, then the PDL crawl,
 * deduped by domain. Empty input returns an empty result without a network call.
 */
export async function fetchEntitySearch(
  config: SifaApiConfig,
  query: string,
  limit?: number,
  options: ApiFetchOptions = {},
): Promise<EntitySearchResponse> {
  if (!query.trim()) return EMPTY_SEARCH;
  const params = new URLSearchParams({ q: query });
  if (limit !== undefined) params.set('limit', String(limit));
  const data = await apiFetch<unknown>(config, `/api/entities/search?${params.toString()}`, {
    cache: 'no-store',
    ...options,
  });
  return EntitySearchResponseSchema.parse(data);
}

/**
 * Record a selection: promote a PDL row into a canonical entity (dedupe by
 * domain) or bump an existing entity's usage counter. Returns the entity plus
 * its portable `entityRef` (null for PDL-only entities). Requires a session.
 */
export async function selectEntity(
  config: SifaApiConfig,
  body: EntitySelectRequest,
  options: ApiFetchOptions = {},
): Promise<EntitySelectResponse> {
  const data = await apiFetch<unknown>(config, '/api/entities/select', {
    method: 'POST',
    body,
    credentials: 'include',
    ...options,
  });
  return EntitySelectResponseSchema.parse(data);
}

/**
 * Grow-on-demand: when the local typeahead misses, resolve the query live via
 * Wikidata, import the org-class matches, and return them. Requires a session.
 * Empty input returns an empty array without a network call.
 */
export async function importSearchEntities(
  config: SifaApiConfig,
  query: string,
  options: ApiFetchOptions = {},
): Promise<EntitySearchResult[]> {
  if (!query.trim()) return [];
  const data = await apiFetch<unknown>(config, '/api/entities/import-search', {
    method: 'POST',
    body: { q: query },
    credentials: 'include',
    ...options,
  });
  return EntityImportSearchResponseSchema.parse(data).results;
}

/**
 * Grow-on-demand by domain, Branch 1: when a domain-shaped typeahead query
 * misses locally, resolve any notable company whose official website is that
 * domain (Wikidata reverse P856), importing the matches. Read-only w.r.t.
 * minting. `canMint` tells the caller whether to offer the user-initiated
 * "Add <domain>" affordance. Requires a session.
 */
export async function resolveEntityDomain(
  config: SifaApiConfig,
  domain: string,
  options: ApiFetchOptions = {},
): Promise<EntityResolveDomainResponse> {
  const data = await apiFetch<unknown>(config, '/api/entities/resolve-domain', {
    method: 'POST',
    body: { domain },
    credentials: 'include',
    ...options,
  });
  return EntityResolveDomainResponseSchema.parse(data);
}

/**
 * Grow-on-demand by domain, Branch 2 (user-initiated): mint a crawled-tier
 * entity from the domain's own homepage (or resolve it to a notable company if
 * one exists). Throws on a non-2xx response (domain not mintable, or the site
 * yielded nothing usable). Requires a session.
 */
export async function mintEntityDomain(
  config: SifaApiConfig,
  domain: string,
  options: ApiFetchOptions = {},
): Promise<EntityMintDomainResponse> {
  const data = await apiFetch<unknown>(config, '/api/entities/mint-domain', {
    method: 'POST',
    body: { domain },
    credentials: 'include',
    ...options,
  });
  return EntityMintDomainResponseSchema.parse(data);
}
