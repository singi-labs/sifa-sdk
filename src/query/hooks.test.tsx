// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from './client.js';
import { SifaProvider } from './config.js';
import { useCreatePosition } from './hooks/use-create-position.js';
import { useProfile } from './hooks/use-profile.js';
import { sifaQueryKeys } from './keys.js';

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

describe('useProfile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns the profile', async () => {
    const fetchImpl = jsonFetch({
      did: 'did:plc:x',
      handle: 'alice.bsky.social',
      claimed: true,
    });

    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useProfile('alice.bsky.social'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toMatchObject({ handle: 'alice.bsky.social' });
  });

  it('resolves to null on 404 instead of erroring', async () => {
    const fetchImpl = jsonFetch({}, 404);

    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useProfile('missing'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeNull();
  });

  it('does not fetch when handleOrDid is empty', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    renderHook(() => useProfile(''), { wrapper: Wrapper });
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('useCreatePosition', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to /api/profile/position and returns the result', async () => {
    const fetchImpl = jsonFetch({ rkey: 'abc123' });

    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useCreatePosition('did:plc:x'), { wrapper: Wrapper });

    await act(async () => {
      const r = await result.current.mutateAsync({ title: 'Founder', company: 'Sifa' });
      expect(r).toEqual({ success: true, rkey: 'abc123' });
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Founder', company: 'Sifa' }));
  });

  it('invalidates the owner profile cache on success', async () => {
    const fetchImpl = jsonFetch({ success: true, rkey: 'abc' });

    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePosition('did:plc:x'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ title: 'Founder' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sifaQueryKeys.profile.byHandle('did:plc:x'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sifaQueryKeys.position.byOwner('did:plc:x'),
    });
  });
});
