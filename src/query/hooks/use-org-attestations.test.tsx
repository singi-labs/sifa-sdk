// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useAttestationRequests, useCreateOrgAttestation } from './use-org-attestations.js';

function jsonFetch(bodies: { body: unknown; status?: number }[]) {
  let i = 0;
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    const next = bodies[Math.min(i, bodies.length - 1)];
    i += 1;
    return Promise.resolve(
      new Response(next?.status === 204 ? null : JSON.stringify(next?.body ?? {}), {
        status: next?.status ?? 200,
      }),
    );
  });
}

function makeWrapper(fetchImpl: ReturnType<typeof jsonFetch>, config: SifaApiConfig) {
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('org attestation hooks', () => {
  it('useAttestationRequests reads under the org.attestationRequests key', async () => {
    const fetchImpl = jsonFetch([
      {
        body: {
          requests: [
            {
              id: 1,
              subjectDid: 'did:plc:s',
              positionRkey: 'p1',
              status: 'pending',
              createdAt: 'x',
            },
          ],
        },
      },
    ]);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useAttestationRequests(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requests[0]?.id).toBe(1);
    expect(queryClient.getQueryState(sifaQueryKeys.org.attestationRequests())).not.toBeUndefined();
  });

  it('useCreateOrgAttestation invalidates the org queries on success', async () => {
    const fetchImpl = jsonFetch([
      {
        body: {
          uri: 'at://x',
          rkey: 'r',
          renderState: 'rendered',
          matchedRkeys: [],
          existing: false,
        },
        status: 201,
      },
    ]);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateOrgAttestation(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ subjectDid: 'did:plc:s', status: 'current' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: sifaQueryKeys.org.all() });
  });
});
