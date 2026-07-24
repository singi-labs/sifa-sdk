// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useMyGithubPullRequests } from './use-github-prs.js';

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

const samplePr = {
  prNumber: 412,
  repoOwner: 'atproto',
  repoName: 'indigo',
  title: 'add keepalive support',
  url: 'https://github.com/atproto/indigo/pull/412',
  language: 'Go',
  additions: 120,
  deletions: 8,
  mergedAt: '2026-04-01T12:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMyGithubPullRequests', () => {
  it('uses the github query key and returns the page', async () => {
    const fetchImpl = jsonFetch({ items: [samplePr], hasMore: false });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useMyGithubPullRequests(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.hasMore).toBe(false);
    expect(queryClient.getQueryState(sifaQueryKeys.github.myPullRequests({}))).not.toBeUndefined();
  });

  it('forwards limit and offset params to the request', async () => {
    const fetchImpl = jsonFetch({ items: [], hasMore: false });
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useMyGithubPullRequests({ limit: 50, offset: 30 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = (fetchImpl as unknown as { mock: { calls: [string][] } }).mock.calls[0]?.[0];
    expect(url).toBe('https://api.example/api/me/github/pull-requests?limit=50&offset=30');
  });
});
