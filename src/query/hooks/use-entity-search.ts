'use client';

import { useEffect, useState } from 'react';
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchEntitySearch,
  importSearchEntities,
  mintEntityDomain,
  resolveEntityDomain,
  selectEntity,
} from '../fetchers/entities.js';
import { sifaQueryKeys } from '../keys.js';
import type {
  EntityMintDomainResponse,
  EntityResolveDomainResponse,
  EntitySearchResponse,
  EntitySearchResult,
  EntitySelectRequest,
  EntitySelectResponse,
} from '../../schemas/entity.js';

/** Debounce a rapidly-changing value (e.g. a typeahead input). */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export interface UseEntitySearchOptions {
  /** Max rows to request (default 5). */
  limit?: number;
  /** Debounce delay in ms (default 250). */
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Debounced organization typeahead. The query is debounced internally, so
 * consumers can pass the raw input value on every keystroke. Skips the network
 * call while the (trimmed, debounced) query is empty.
 */
export function useEntitySearch(
  query: string,
  opts: UseEntitySearchOptions = {},
  queryOptions?: Omit<
    UseQueryOptions<
      EntitySearchResponse,
      Error,
      EntitySearchResponse,
      ReturnType<typeof sifaQueryKeys.entity.search>
    >,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const config = useSifaConfig();
  const { limit = 5, debounceMs = 250, enabled = true } = opts;
  const debounced = useDebouncedValue(query.trim(), debounceMs);
  return useQuery({
    queryKey: sifaQueryKeys.entity.search(debounced, limit),
    queryFn: () => fetchEntitySearch(config, debounced, limit),
    enabled: enabled && debounced.length > 0,
    ...queryOptions,
  });
}

/** Mutation: record a selection (promote a PDL row or bump an entity). */
export function useSelectEntity(
  options?: Omit<
    UseMutationOptions<EntitySelectResponse, Error, EntitySelectRequest>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (body: EntitySelectRequest) => selectEntity(config, body),
    ...options,
  });
}

/** Mutation: grow-on-demand Wikidata import for a typeahead miss. */
export function useImportSearchEntities(
  options?: Omit<UseMutationOptions<EntitySearchResult[], Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (query: string) => importSearchEntities(config, query),
    ...options,
  });
}

/**
 * Mutation: grow-on-demand by domain, Branch 1. Resolve a domain-shaped
 * typeahead miss to any notable company (Wikidata reverse P856). The response's
 * `canMint` flag drives the "Add <domain>" affordance.
 */
export function useResolveEntityDomain(
  options?: Omit<UseMutationOptions<EntityResolveDomainResponse, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (domain: string) => resolveEntityDomain(config, domain),
    ...options,
  });
}

/**
 * Mutation: grow-on-demand by domain, Branch 2 (user-initiated). Mint a
 * crawled-tier entity from the domain's homepage. Rejects when the domain is not
 * mintable or the site yields nothing usable.
 */
export function useMintEntityDomain(
  options?: Omit<UseMutationOptions<EntityMintDomainResponse, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (domain: string) => mintEntityDomain(config, domain),
    ...options,
  });
}
