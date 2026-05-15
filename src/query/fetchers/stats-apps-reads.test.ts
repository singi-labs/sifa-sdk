import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchAppsRegistry, fetchHiddenApps } from './apps.js';
import { fetchAtFundLink } from './profile.js';
import { fetchStats } from './stats.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchStats', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchStats({ ...baseConfig, fetch: fetchImpl });
    expect(result).toBeNull();
  });

  it('returns the stats payload on success', async () => {
    const payload = {
      profileCount: 42,
      avatars: ['https://cdn.example/a.png'],
      atproto: { userCount: 1000, growthPerSecond: 0.5, timestamp: 1000 },
    };
    const fetchImpl = jsonFetch(payload);
    const result = await fetchStats({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(payload);
  });

  it('hits /api/stats', async () => {
    const fetchImpl = jsonFetch({ profileCount: 0, avatars: [], atproto: null });
    await fetchStats({ ...baseConfig, fetch: fetchImpl });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/stats');
  });
});

describe('fetchAppsRegistry', () => {
  it('returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchAppsRegistry({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual([]);
  });

  it('returns the apps array on success', async () => {
    const apps = [
      {
        id: 'bsky',
        name: 'Bluesky',
        category: 'social',
        collectionPrefixes: ['app.bsky.'],
        scanCollections: ['app.bsky.feed.post'],
        color: '#0085ff',
      },
    ];
    const fetchImpl = jsonFetch(apps);
    const result = await fetchAppsRegistry({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(apps);
  });

  it('hits /api/apps/registry', async () => {
    const fetchImpl = jsonFetch([]);
    await fetchAppsRegistry({ ...baseConfig, fetch: fetchImpl });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/apps/registry');
  });
});

describe('fetchHiddenApps', () => {
  it('returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 401);
    const result = await fetchHiddenApps({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual([]);
  });

  it('extracts the apps field from the response', async () => {
    const apps = [
      { id: 'bsky', name: 'Bluesky', category: 'social' },
      { id: 'wb', name: 'Whitewind', category: 'writing' },
    ];
    const fetchImpl = jsonFetch({ apps });
    const result = await fetchHiddenApps({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(apps);
  });

  it('forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({ apps: [] });
    await fetchHiddenApps({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('fetchAtFundLink', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchAtFundLink({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBeNull();
  });

  it('returns the url field on success', async () => {
    const fetchImpl = jsonFetch({ url: 'https://atfund.example/profile/abc' });
    const result = await fetchAtFundLink({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBe('https://atfund.example/profile/abc');
  });

  it('returns null when url field is missing or non-string', async () => {
    const fetchImpl = jsonFetch({ url: 42 });
    const result = await fetchAtFundLink({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBeNull();
  });

  it('URL-encodes the DID in the path', async () => {
    const fetchImpl = jsonFetch({ url: null });
    await fetchAtFundLink({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profiles/did%3Aplc%3Aabc/at-fund-link');
  });
});
