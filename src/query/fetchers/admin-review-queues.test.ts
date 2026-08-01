import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAdminReviewQueues } from './admin-review-queues.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: undefined };

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

describe('getAdminReviewQueues', () => {
  it('GETs the review-queues endpoint with credentials and no cache', async () => {
    const fetchImpl = jsonFetch(payload);

    const result = await getAdminReviewQueues({ ...config, fetch: fetchImpl });

    expect(result).toEqual(payload);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/admin/stats/review-queues');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
  });

  it('forwards a cookie header for RSC callers', async () => {
    const fetchImpl = jsonFetch(payload);

    await getAdminReviewQueues({ ...config, fetch: fetchImpl }, { cookieHeader: 'sid=abc' });

    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('sid=abc');
  });

  it('derives the total when an older API omits it', async () => {
    // sifa-api and sifa-web deploy independently; a web build can briefly run
    // against an API that predates the aggregate field.
    const fetchImpl = jsonFetch({ ideas: 2, nameCorrections: 1, pendingCompanies: 4 });

    const result = await getAdminReviewQueues({ ...config, fetch: fetchImpl });

    expect(result.total).toBe(7);
  });

  it('rejects on a non-admin response instead of reporting empty queues', async () => {
    // Zeroes would read as "all clear" in the nav pill, which is worse than
    // showing nothing at all.
    const fetchImpl = jsonFetch({ message: 'Forbidden' }, 403);

    await expect(getAdminReviewQueues({ ...config, fetch: fetchImpl })).rejects.toThrow();
  });
});
