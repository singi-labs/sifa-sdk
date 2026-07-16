// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { useOrgProfile } from './use-org-profile.js';
import { useOrgClaim } from './use-org-claim.js';

function makeWrapper(fetchImpl: typeof fetch, config: SifaApiConfig) {
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

describe('useOrgProfile', () => {
  it('selects the org floor verdict off the profile resolve', async () => {
    const fetchImpl = jsonFetch({
      did: 'did:plc:acme',
      handle: 'acme.com',
      claimed: true,
      org: {
        isOrg: true,
        orgProfile: {
          name: 'Acme',
          description: null,
          website: null,
          logoBlob: null,
          entityRefs: ['q'],
        },
      },
    });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useOrgProfile('acme.com'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      isOrg: true,
      orgProfile: {
        name: 'Acme',
        description: null,
        website: null,
        logoBlob: null,
        entityRefs: ['q'],
      },
    });
    // Hits the shared profile resolve endpoint (no dedicated org GET).
    const calls = (fetchImpl as unknown as { mock: { calls: [string][] } }).mock.calls;
    expect(calls[0]![0]).toBe('https://api.example/api/profile/acme.com');
  });

  it('returns null when the profile predates the org field', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:x', handle: 'jane.com', claimed: true });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useOrgProfile('jane.com'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useOrgClaim', () => {
  it('exposes a mutate function and posts the claim', async () => {
    const fetchImpl = jsonFetch({
      orgDid: 'did:plc:acme',
      status: 'active',
      bindings: [],
      orgProfile: { name: 'Acme', description: null, website: null, entityRefs: ['q'] },
    });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useOrgClaim('acme.com'), { wrapper: Wrapper });

    result.current.mutate({ name: 'Acme', entityRefs: ['q'], authorityAck: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.orgDid).toBe('did:plc:acme');
  });
});
