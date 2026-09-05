import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchProfileCompleteness } from './profile-completeness.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchProfileCompleteness', () => {
  it('returns the completeness from /api/profile/completeness', async () => {
    const body = { complete: false, score: 4, total: 6, missing: ['about', 'certification'] };
    const fetchImpl = jsonFetch(body);
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(body);
    expect(getCall(fetchImpl)[0]).toContain('/api/profile/completeness');
  });

  it('degrades to complete (no missing) when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ complete: true, score: 6, total: 6, missing: [] });
    await fetchProfileCompleteness(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=abc' },
    );
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});
