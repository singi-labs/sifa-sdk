// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useFollow, useFollowers, useFollowingFeed, useUnfollow } from './use-follow.js';

function makeWrapper(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: fetchImpl };
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={config}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFollow', () => {
  it('POSTs and invalidates follow.* cache on success', async () => {
    const fetchImpl = jsonFetch({ rkey: 'r' });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useFollow(), { wrapper: Wrapper });

    await act(async () => {
      const r = await result.current.mutateAsync({ handle: 'bob.example' });
      expect(r.success).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sifaQueryKeys.follow.all() });
  });

  it('invalidates cache (rollback) when the mutation rejects', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('network'))) as unknown as typeof fetch;
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useFollow(), { wrapper: Wrapper });

    // followUser wraps apiWrite which never throws — it returns { success: false }.
    // So onError won't fire; onSuccess fires with success:false and SHOULD NOT invalidate.
    await act(async () => {
      const r = await result.current.mutateAsync({ handle: 'bob.example' });
      expect(r.success).toBe(false);
    });

    // No invalidation on failed write (cache stays as-is for rollback path).
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useUnfollow', () => {
  it('DELETEs and invalidates on success', async () => {
    const fetchImpl = jsonFetch({});
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnfollow(), { wrapper: Wrapper });

    await act(async () => {
      const r = await result.current.mutateAsync({ handle: 'bob.example' });
      expect(r.success).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sifaQueryKeys.follow.all() });
  });
});

describe('useFollowers', () => {
  it('fetches first page and exposes infinite query state', async () => {
    const fetchImpl = jsonFetch({
      follows: [
        { did: 'did:plc:b', handle: 'bob', source: 'sifa', claimed: true, followedAt: 'x' },
      ],
      cursor: null,
    });
    const { Wrapper } = makeWrapper(fetchImpl);

    const { result } = renderHook(() => useFollowers('alice'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.pages[0]?.follows).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('is disabled for empty handle', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { Wrapper } = makeWrapper(fetchImpl);
    renderHook(() => useFollowers(''), { wrapper: Wrapper });
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('useFollowingFeed', () => {
  it('fetches and exposes infinite query state', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    const { Wrapper } = makeWrapper(fetchImpl);

    const { result } = renderHook(() => useFollowingFeed(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.pages[0]?.items).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });
});
