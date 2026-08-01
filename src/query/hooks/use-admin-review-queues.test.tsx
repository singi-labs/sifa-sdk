// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useAdminReviewQueues } from './use-admin-review-queues.js';

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

const payload = {
  ideas: 3,
  nameCorrections: 1,
  pendingCompanies: 7,
  total: 11,
  generatedAt: '2026-08-01T09:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAdminReviewQueues', () => {
  it('reads the counts under the admin.reviewQueues key', async () => {
    const fetchImpl = jsonFetch(payload);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);

    const { result } = renderHook(() => useAdminReviewQueues(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(11);
    expect(queryClient.getQueryState(sifaQueryKeys.admin.reviewQueues())).not.toBeUndefined();
  });

  it('serves two consumers from one request', async () => {
    // The nav pill and the review-queues page mount together; the shared key
    // plus staleTime is the whole point of putting this in the SDK.
    const fetchImpl = jsonFetch(payload);
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);

    const { result } = renderHook(
      () => ({ a: useAdminReviewQueues(), b: useAdminReviewQueues() }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.a.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.b.isSuccess).toBe(true));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error rather than zeroed counts for non-admins', async () => {
    const fetchImpl = jsonFetch({ message: 'Forbidden' }, 403);
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);

    const { result } = renderHook(() => useAdminReviewQueues(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
