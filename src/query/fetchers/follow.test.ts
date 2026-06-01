import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  followUser,
  getFollowers,
  getFollowing,
  getFollowingFeed,
  unfollowUser,
} from './follow.js';
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

describe('followUser', () => {
  it('POSTs to /api/follow/:handle and returns success on 200', async () => {
    const fetchImpl = jsonFetch({ rkey: '3kfollow', subjectDid: 'did:plc:b' });
    const result = await followUser({ ...config, fetch: fetchImpl }, 'bob.example');

    expect(result.success).toBe(true);
    expect(result.rkey).toBe('3kfollow');
    expect(result.subjectDid).toBe('did:plc:b');

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/follow/bob.example');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
  });

  it('forwards note in body when provided', async () => {
    const fetchImpl = jsonFetch({ rkey: 'r' });
    await followUser({ ...config, fetch: fetchImpl }, 'bob.example', { note: 'colleague' });
    const [, init] = getCall(fetchImpl);
    expect(init.body).toBe(JSON.stringify({ note: 'colleague' }));
  });

  it('returns success: false with server message on 400', async () => {
    const fetchImpl = jsonFetch({ message: 'Self-follow not allowed' }, 400);
    const result = await followUser({ ...config, fetch: fetchImpl }, 'bob.example');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Self-follow not allowed');
  });

  it('treats duplicate follow as idempotent (200 from server)', async () => {
    const fetchImpl = jsonFetch({ rkey: 'existing-rkey' }, 200);
    const result = await followUser({ ...config, fetch: fetchImpl }, 'bob.example');
    expect(result.success).toBe(true);
    expect(result.rkey).toBe('existing-rkey');
  });

  it('URL-encodes the handle', async () => {
    const fetchImpl = jsonFetch({ rkey: 'r' });
    await followUser({ ...config, fetch: fetchImpl }, 'weird name/with slashes');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/follow/weird%20name%2Fwith%20slashes');
  });
});

describe('unfollowUser', () => {
  it('DELETEs /api/follow/:handle', async () => {
    const fetchImpl = jsonFetch({});
    const result = await unfollowUser({ ...config, fetch: fetchImpl }, 'bob.example');
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/follow/bob.example');
    expect(init.method).toBe('DELETE');
  });
});

describe('getFollowers / getFollowing', () => {
  it('returns the server payload with cursor coerced to null when absent', async () => {
    const fetchImpl = jsonFetch({ follows: [{ did: 'did:plc:b', handle: 'bob' }] });
    const result = await getFollowers({ ...config, fetch: fetchImpl }, 'alice');
    expect(result.cursor).toBeNull();
    expect(result.follows).toHaveLength(1);
  });

  it('passes cursor + limit as query params', async () => {
    const fetchImpl = jsonFetch({ follows: [], cursor: 'next' });
    await getFollowing({ ...config, fetch: fetchImpl }, 'alice', { cursor: 'abc', limit: 25 });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/alice/following?cursor=abc&limit=25');
  });

  it('returns empty page on network error', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch;
    const result = await getFollowers({ ...config, fetch: fetchImpl }, 'alice');
    expect(result).toEqual({ follows: [], cursor: null });
  });
});

describe('getFollowingFeed', () => {
  it('GETs /api/following/feed and returns the page', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    const result = await getFollowingFeed({ ...config, fetch: fetchImpl });
    expect(result).toEqual({ items: [], cursor: null });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/following/feed');
  });

  it('joins categories with commas', async () => {
    const fetchImpl = jsonFetch({ items: [], cursor: null });
    await getFollowingFeed(
      { ...config, fetch: fetchImpl },
      { categories: ['Articles', 'Posts'], limit: 50 },
    );
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/following/feed?limit=50&categories=Articles%2CPosts');
  });

  it('returns empty page on error', async () => {
    const fetchImpl = jsonFetch({ message: 'bad' }, 500);
    const result = await getFollowingFeed({ ...config, fetch: fetchImpl });
    expect(result).toEqual({ items: [], cursor: null });
  });
});
