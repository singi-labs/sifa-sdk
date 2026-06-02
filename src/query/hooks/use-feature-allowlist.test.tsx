// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import type { FeatureAllowlistResponse } from '../fetchers/admin-feature-allowlists.js';
import {
  useAddFeatureAllowlist,
  useFeatureAllowlist,
  useRemoveFeatureAllowlist,
} from './use-feature-allowlist.js';

function makeWrapper(fetchImpl: typeof fetch, config: SifaApiConfig) {
  // NB: keep `gcTime` non-zero — these tests inspect cache data after the
  // mutation settles, when no observer is active. `gcTime: 0` would evict
  // the entry immediately and make `getQueryData` return undefined.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
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

describe('useFeatureAllowlist', () => {
  it('reads from /api/admin/feature-allowlists/:flag and caches by flag', async () => {
    const fetchImpl = jsonFetch({
      items: [{ did: 'did:plc:a', addedAt: '2026-06-01T10:00:00.000Z', note: null }],
    });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useFeatureAllowlist('FEED_V5_ENABLED'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(
      queryClient.getQueryState(sifaQueryKeys.admin.featureAllowlist('FEED_V5_ENABLED')),
    ).not.toBeUndefined();
  });
});

describe('useAddFeatureAllowlist', () => {
  it('optimistically prepends the new entry and invalidates on settle', async () => {
    const fetchImpl = jsonFetch({ status: 'ok' }, 201);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const key = sifaQueryKeys.admin.featureAllowlist('FEED_V5_ENABLED');
    queryClient.setQueryData<FeatureAllowlistResponse>(key, {
      items: [{ did: 'did:plc:existing', addedAt: '2026-05-01T00:00:00.000Z', note: null }],
    });

    const { result } = renderHook(() => useAddFeatureAllowlist('FEED_V5_ENABLED'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ did: 'did:plc:new', note: 'beta' });
    });

    const cached = queryClient.getQueryData<FeatureAllowlistResponse>(key);
    expect(cached?.items[0]?.did).toBe('did:plc:new');
    expect(cached?.items[0]?.note).toBe('beta');
  });

  it('rolls back optimistic insert on server error', async () => {
    const fetchImpl = jsonFetch({ message: 'Invalid DID' }, 400);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const key = sifaQueryKeys.admin.featureAllowlist('FEED_V5_ENABLED');
    const initial: FeatureAllowlistResponse = {
      items: [{ did: 'did:plc:existing', addedAt: '2026-05-01T00:00:00.000Z', note: null }],
    };
    queryClient.setQueryData(key, initial);

    const { result } = renderHook(() => useAddFeatureAllowlist('FEED_V5_ENABLED'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      const r = await result.current.mutateAsync({ did: 'not-a-did' });
      expect(r.success).toBe(false);
    });

    // After settle the cache is invalidated. We can still observe rollback
    // happened by checking only the prior single entry is present prior to
    // any refetch firing.
    const cached = queryClient.getQueryData<FeatureAllowlistResponse>(key);
    expect(cached?.items.map((e) => e.did)).toEqual(['did:plc:existing']);
  });
});

describe('useRemoveFeatureAllowlist', () => {
  it('optimistically removes the row from the cache', async () => {
    const fetchImpl = jsonFetch({ status: 'ok' });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const key = sifaQueryKeys.admin.featureAllowlist('FEED_V5_ENABLED');
    queryClient.setQueryData<FeatureAllowlistResponse>(key, {
      items: [
        { did: 'did:plc:a', addedAt: '2026-05-01T00:00:00.000Z', note: null },
        { did: 'did:plc:b', addedAt: '2026-05-02T00:00:00.000Z', note: null },
      ],
    });

    const { result } = renderHook(() => useRemoveFeatureAllowlist('FEED_V5_ENABLED'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ did: 'did:plc:a' });
    });

    const cached = queryClient.getQueryData<FeatureAllowlistResponse>(key);
    expect(cached?.items.map((e) => e.did)).toEqual(['did:plc:b']);
  });
});
