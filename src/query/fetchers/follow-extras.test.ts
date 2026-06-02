import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBlueskySuggestions, getMutuals } from './follow-extras.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: undefined };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getMutuals', () => {
  it('GETs /api/profile/:handleOrDid/mutuals and returns the page', async () => {
    const fetchImpl = jsonFetch({
      items: [
        {
          did: 'did:plc:b',
          handle: 'bob',
          source: 'sifa',
          claimed: true,
          followedAt: '2026-06-01T10:00:00.000Z',
        },
      ],
      cursor: 'next-cursor',
    });
    const result = await getMutuals({ ...config, fetch: fetchImpl }, 'alice');
    expect(result.items).toHaveLength(1);
    expect(result.cursor).toBe('next-cursor');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/alice/mutuals');
  });

  it('passes cursor + limit as query params', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    await getMutuals({ ...config, fetch: fetchImpl }, 'alice', { cursor: 'abc', limit: 25 });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/alice/mutuals?cursor=abc&limit=25');
  });

  it('URL-encodes the handle (works with did: identifiers too)', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    await getMutuals({ ...config, fetch: fetchImpl }, 'did:plc:abcdef');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/did%3Aplc%3Aabcdef/mutuals');
  });

  it('coerces missing cursor to null', async () => {
    const fetchImpl = jsonFetch({ items: [] });
    const result = await getMutuals({ ...config, fetch: fetchImpl }, 'alice');
    expect(result.cursor).toBeNull();
  });

  it('returns an empty page on network error', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch;
    const result = await getMutuals({ ...config, fetch: fetchImpl }, 'alice');
    expect(result).toEqual({ items: [], cursor: null });
  });

  it('returns an empty page on 404', async () => {
    const fetchImpl = jsonFetch({ error: 'NotFound' }, 404);
    const result = await getMutuals({ ...config, fetch: fetchImpl }, 'unknown');
    expect(result).toEqual({ items: [], cursor: null });
  });

  it('forwards a cookie header when provided (RSC path)', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    await getMutuals({ ...config, fetch: fetchImpl }, 'alice', { cookieHeader: 'sid=abc' });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('sid=abc');
  });
});

describe('getBlueskySuggestions', () => {
  it('GETs /api/me/bluesky-suggestions', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    const result = await getBlueskySuggestions({ ...config, fetch: fetchImpl });
    expect(result).toEqual({ items: [], cursor: null });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/bluesky-suggestions');
    expect(init.credentials).toBe('include');
  });

  it('passes cursor + limit as query params', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: 'c2' });
    await getBlueskySuggestions({ ...config, fetch: fetchImpl }, { cursor: 'c1', limit: 50 });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/bluesky-suggestions?cursor=c1&limit=50');
  });

  it('returns empty page on 401 (unauthenticated)', async () => {
    const fetchImpl = jsonFetch({ message: 'Unauthorized' }, 401);
    const result = await getBlueskySuggestions({ ...config, fetch: fetchImpl });
    expect(result).toEqual({ items: [], cursor: null });
  });
});
