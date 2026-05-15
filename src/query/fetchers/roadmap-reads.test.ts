import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchMyRoadmapVotes, fetchRoadmapVotes } from './roadmap.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchRoadmapVotes', () => {
  it('returns {} on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({});
  });

  it('returns the votes map on success', async () => {
    const payload = {
      'item-a': { count: 3, voters: [{ did: 'did:plc:a' }, { did: 'did:plc:b' }] },
      'item-b': { count: 1, voters: [{ did: 'did:plc:c', avatarUrl: 'https://cdn/a.png' }] },
    };
    const fetchImpl = jsonFetch(payload);
    const result = await fetchRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(payload);
  });

  it('hits /api/roadmap/votes', async () => {
    const fetchImpl = jsonFetch({});
    await fetchRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/votes');
  });
});

describe('fetchMyRoadmapVotes', () => {
  it('returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 401);
    const result = await fetchMyRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual([]);
  });

  it('returns the voted array from the response', async () => {
    const fetchImpl = jsonFetch({ voted: ['item-a', 'item-b'] });
    const result = await fetchMyRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(['item-a', 'item-b']);
  });

  it('returns [] when voted field is missing', async () => {
    const fetchImpl = jsonFetch({});
    const result = await fetchMyRoadmapVotes({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual([]);
  });

  it('forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({ voted: [] });
    await fetchMyRoadmapVotes({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=zzz' });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=zzz');
  });
});
