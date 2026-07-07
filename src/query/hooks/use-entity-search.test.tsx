// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { useEntitySearch, useSelectEntity } from './use-entity-search.js';

function makeWrapper(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: fetchImpl };
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={config}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper };
}

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

afterEach(() => vi.restoreAllMocks());

describe('useEntitySearch', () => {
  it('debounces then fetches and returns results', async () => {
    const fetchImpl = jsonFetch({
      results: [
        {
          source: 'entity',
          entityId: 1,
          kind: 'org',
          name: 'Spryker',
          domain: 'spryker.com',
          country: 'DE',
          logoUrl: null,
          parentName: null,
        },
      ],
      hasMore: false,
    });
    const { Wrapper } = makeWrapper(fetchImpl);
    const { result } = renderHook(() => useEntitySearch('Spryker', { debounceMs: 5 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data?.results[0]?.name).toBe('Spryker'));
    const [url] = (fetchImpl as unknown as { mock: { calls: [string][] } }).mock.calls[0]!;
    expect(url).toContain('/api/entities/search?q=Spryker');
  });

  it('does not fetch for a blank query', async () => {
    const fetchImpl = jsonFetch({ results: [], hasMore: false });
    const { Wrapper } = makeWrapper(fetchImpl);
    const { result } = renderHook(() => useEntitySearch('   ', { debounceMs: 5 }), {
      wrapper: Wrapper,
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.fetchStatus).toBe('idle');
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(0);
  });
});

describe('useSelectEntity', () => {
  it('POSTs a selection and returns the parsed response', async () => {
    const fetchImpl = jsonFetch({
      entityId: 3,
      slug: 'acme',
      kind: 'org',
      canonicalName: 'Acme',
      domain: 'acme.com',
      entityRef: null,
    });
    const { Wrapper } = makeWrapper(fetchImpl);
    const { result } = renderHook(() => useSelectEntity(), { wrapper: Wrapper });

    let response: { entityId: number; entityRef: string | null } | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ pdlId: 'abc' });
    });
    expect(response?.entityId).toBe(3);
    expect(response?.entityRef).toBeNull();
  });
});
