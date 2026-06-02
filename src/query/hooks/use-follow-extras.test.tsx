// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useBlueskySuggestions, useMutuals } from './use-follow-extras.js';

function makeWrapper(fetchImpl: typeof fetch, config: SifaApiConfig) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={{ ...config, fetch: fetchImpl }}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMutuals', () => {
  it('uses the mutuals query key and returns the first page', async () => {
    const fetchImpl = jsonFetch({
      items: [
        {
          did: 'did:plc:b',
          handle: 'bob',
          source: 'sifa',
          claimed: true,
          followedAt: '2026-06-01T10:00:00.000Z',
        },
      ],
      cursor: null,
    });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useMutuals('alice'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items).toHaveLength(1);
    expect(queryClient.getQueryState(sifaQueryKeys.follow.mutuals('alice'))).not.toBeUndefined();
  });

  it('is disabled when handle is empty', () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useMutuals(''), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('useBlueskySuggestions', () => {
  it('uses the bluesky-suggestions query key', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useBlueskySuggestions(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      queryClient.getQueryState(sifaQueryKeys.follow.blueskySuggestions()),
    ).not.toBeUndefined();
  });
});
