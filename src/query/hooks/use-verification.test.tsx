// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useVerificationLog } from './use-verification.js';

function makeWrapper(fetchImpl: typeof fetch, config: SifaApiConfig) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
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

describe('useVerificationLog', () => {
  it('reads one position log under the verification.log key', async () => {
    const events = [
      {
        id: 1,
        kind: 'org_confirmed',
        occurredAt: '2026-09-30T10:00:00.000Z',
        entityId: null,
        emailDomain: null,
        meta: {},
      },
    ];
    const fetchImpl = jsonFetch({ events });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);

    const { result } = renderHook(() => useVerificationLog('did:plc:owner', 'p1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.events[0]?.kind).toBe('org_confirmed');
    expect(
      queryClient.getQueryState(sifaQueryKeys.verification.log('did:plc:owner', 'p1')),
    ).not.toBeUndefined();
  });

  it('resolves to an empty log when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'nope' }, 500);
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);

    const { result } = renderHook(() => useVerificationLog('did:plc:owner', 'p1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ events: [] });
  });
});
