import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMyGithubPullRequests } from './github-prs.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: undefined };

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

describe('fetchMyGithubPullRequests', () => {
  it('GETs /api/me/github/pull-requests and returns the page', async () => {
    const fetchImpl = jsonFetch({ items: [samplePr], hasMore: false });
    const result = await fetchMyGithubPullRequests({ ...config, fetch: fetchImpl });

    expect(result.items).toEqual([samplePr]);
    expect(result.hasMore).toBe(false);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/github/pull-requests');
    expect(init.credentials).toBe('include');
  });

  it('passes limit + offset as query params', async () => {
    const fetchImpl = jsonFetch({ items: [], hasMore: false });
    await fetchMyGithubPullRequests({ ...config, fetch: fetchImpl }, { limit: 50, offset: 30 });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/github/pull-requests?limit=50&offset=30');
  });

  it('rejects a malformed response body (Zod validation)', async () => {
    // `prNumber` as a string violates the schema -> parse throws.
    const fetchImpl = jsonFetch({ items: [{ ...samplePr, prNumber: 'oops' }], hasMore: false });
    await expect(fetchMyGithubPullRequests({ ...config, fetch: fetchImpl })).rejects.toThrow();
  });
});
