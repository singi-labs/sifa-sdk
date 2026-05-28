// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import {
  useBulkHideProfileItems,
  useBulkUnhideProfileItems,
  useHideProfileItem,
  useUnhideProfileItem,
} from './use-profile-items-hide.js';

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

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('useHideProfileItem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to /api/profile/items/hide with the item descriptor', async () => {
    const fetchImpl = jsonFetch({ ok: true });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useHideProfileItem('did:plc:x'), { wrapper: Wrapper });

    await act(async () => {
      const r = await result.current.mutateAsync({
        itemType: 'position',
        source: 'pds',
        itemId: 'rkey1',
      });
      expect(r).toEqual({ success: true, ok: true });
    });

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/items/hide');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({ itemType: 'position', source: 'pds', itemId: 'rkey1' }),
    );
  });

  it('invalidates the owner profile cache on success', async () => {
    const fetchImpl = jsonFetch({ ok: true });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useHideProfileItem('did:plc:x'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ itemType: 'honor', source: 'pds', itemId: 'h1' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sifaQueryKeys.profile.byHandle('did:plc:x'),
    });
  });
});

describe('useUnhideProfileItem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs to /api/profile/items/hide with the item descriptor', async () => {
    const fetchImpl = jsonFetch({ ok: true });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useUnhideProfileItem('did:plc:x'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        itemType: 'language',
        source: 'pds',
        itemId: 'lang1',
      });
    });

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/items/hide');
    expect(init.method).toBe('DELETE');
    expect(init.body).toBe(
      JSON.stringify({ itemType: 'language', source: 'pds', itemId: 'lang1' }),
    );
  });
});

describe('useBulkHideProfileItems', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs an itemIds array to /api/profile/items/bulk-hide', async () => {
    const fetchImpl = jsonFetch({ ok: true, count: 3 });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useBulkHideProfileItems('did:plc:x'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        itemType: 'publication',
        source: 'standard',
        itemIds: ['a', 'b', 'c'],
      });
    });

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/items/bulk-hide');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        itemType: 'publication',
        source: 'standard',
        itemIds: ['a', 'b', 'c'],
      }),
    );
  });
});

describe('useBulkUnhideProfileItems', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs with itemIds array to /api/profile/items/bulk-hide', async () => {
    const fetchImpl = jsonFetch({ ok: true });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useBulkUnhideProfileItems('did:plc:x'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        itemType: 'publication',
        source: 'standard',
        itemIds: ['a', 'b'],
      });
    });

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/items/bulk-hide');
    expect(init.method).toBe('DELETE');
  });
});
