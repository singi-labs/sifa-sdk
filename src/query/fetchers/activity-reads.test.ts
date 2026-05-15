import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchActivityFeed, fetchActivityTeaser, fetchHeatmapData } from './activity.js';
import { fetchEndorsementCount } from './endorsement.js';
import { fetchNetworkStreamCount } from './stream.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchHeatmapData', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchHeatmapData({ ...baseConfig, fetch: fetchImpl }, 'alice', 30);
    expect(result).toBeNull();
  });

  it('returns the heatmap payload on success', async () => {
    const payload = {
      days: [{ date: '2026-05-01', total: 3, apps: [{ appId: 'bsky', count: 3 }] }],
      appTotals: [{ appId: 'bsky', appName: 'Bluesky', total: 3 }],
      thresholds: [1, 3, 5, 10],
    };
    const fetchImpl = jsonFetch(payload);
    const result = await fetchHeatmapData({ ...baseConfig, fetch: fetchImpl }, 'alice', 30);
    expect(result).toEqual(payload);
  });

  it('builds the heatmap path with encoded handle and days param', async () => {
    const fetchImpl = jsonFetch({ days: [], appTotals: [], thresholds: [1, 2, 3, 4] });
    await fetchHeatmapData({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc', 90);
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity/did%3Aplc%3Aabc/heatmap?days=90');
  });
});

describe('fetchActivityTeaser', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchActivityTeaser({ ...baseConfig, fetch: fetchImpl }, 'alice');
    expect(result).toBeNull();
  });

  it('returns the teaser payload on success', async () => {
    const payload = { items: [], blueskyGated: true };
    const fetchImpl = jsonFetch(payload);
    const result = await fetchActivityTeaser({ ...baseConfig, fetch: fetchImpl }, 'alice');
    expect(result).toEqual(payload);
  });

  it('forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({ items: [] });
    await fetchActivityTeaser({ ...baseConfig, fetch: fetchImpl }, 'alice', {
      cookieHeader: 'session=abc',
    });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('fetchActivityFeed', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchActivityFeed({ ...baseConfig, fetch: fetchImpl }, 'alice');
    expect(result).toBeNull();
  });

  it('builds query string from optional opts', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null, hasMore: false });
    await fetchActivityFeed({ ...baseConfig, fetch: fetchImpl }, 'alice', {
      category: 'social',
      limit: 25,
      cursor: 'abc',
    });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('/api/activity/alice?');
    expect(url).toContain('category=social');
    expect(url).toContain('limit=25');
    expect(url).toContain('cursor=abc');
  });

  it('forwards cookie header when provided', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null, hasMore: false });
    await fetchActivityFeed({ ...baseConfig, fetch: fetchImpl }, 'alice', {
      cookieHeader: 'session=xyz',
    });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=xyz');
  });
});

describe('fetchEndorsementCount', () => {
  it('returns 0 on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchEndorsementCount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBe(0);
  });

  it('returns the length of the endorsements array', async () => {
    const fetchImpl = jsonFetch({ endorsements: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const result = await fetchEndorsementCount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBe(3);
  });

  it('returns 0 when payload shape is unexpected', async () => {
    const fetchImpl = jsonFetch({ endorsements: 'not-an-array' });
    const result = await fetchEndorsementCount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    expect(result).toBe(0);
  });

  it('URL-encodes the DID', async () => {
    const fetchImpl = jsonFetch({ endorsements: [] });
    await fetchEndorsementCount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsement/did%3Aplc%3Aabc');
  });
});

describe('fetchNetworkStreamCount', () => {
  it('returns 0 on 404 (endpoint not yet shipped)', async () => {
    const fetchImpl = jsonFetch({}, 404);
    const result = await fetchNetworkStreamCount(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:abc',
    );
    expect(result).toBe(0);
  });

  it('returns the length of the items array', async () => {
    const fetchImpl = jsonFetch({ items: [{ uri: 'a' }, { uri: 'b' }] });
    const result = await fetchNetworkStreamCount(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:abc',
    );
    expect(result).toBe(2);
  });

  it('returns 0 when payload shape is unexpected', async () => {
    const fetchImpl = jsonFetch({ items: 42 });
    const result = await fetchNetworkStreamCount(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:abc',
    );
    expect(result).toBe(0);
  });

  it('forwards cookie header when provided', async () => {
    const fetchImpl = jsonFetch({ items: [] });
    await fetchNetworkStreamCount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc', {
      cookieHeader: 'session=zzz',
    });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=zzz');
  });
});
