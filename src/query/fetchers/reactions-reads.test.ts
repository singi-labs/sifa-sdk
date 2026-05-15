import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { checkAppAccount, fetchReactionStatus } from './reactions.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchReactionStatus', () => {
  it('returns {} for an empty input list without hitting the network', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchReactionStatus({ ...baseConfig, fetch: fetchImpl }, []);
    expect(result).toEqual({});
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchReactionStatus({ ...baseConfig, fetch: fetchImpl }, [
      'at://did:plc:abc/app.bsky.feed.post/xyz',
    ]);
    expect(result).toBeNull();
  });

  it('returns the status map on success', async () => {
    const payload = {
      'at://did:plc:abc/app.bsky.feed.post/xyz': {
        reacted: true,
        rkey: 'r1',
        collection: 'app.bsky.feed.like',
      },
    };
    const fetchImpl = jsonFetch(payload);
    const result = await fetchReactionStatus({ ...baseConfig, fetch: fetchImpl }, [
      'at://did:plc:abc/app.bsky.feed.post/xyz',
    ]);
    expect(result).toEqual(payload);
  });

  it('URL-encodes comma-joined URIs', async () => {
    const fetchImpl = jsonFetch({});
    await fetchReactionStatus({ ...baseConfig, fetch: fetchImpl }, [
      'at://did:plc:a/c/r1',
      'at://did:plc:b/c/r2',
    ]);
    const [url] = getCall(fetchImpl);
    expect(url).toBe(
      'https://api.example/api/reactions/status?uris=at%3A%2F%2Fdid%3Aplc%3Aa%2Fc%2Fr1%2Cat%3A%2F%2Fdid%3Aplc%3Ab%2Fc%2Fr2',
    );
  });

  it('forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({});
    await fetchReactionStatus({ ...baseConfig, fetch: fetchImpl }, ['at://x'], {
      cookieHeader: 'session=abc',
    });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('checkAppAccount', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await checkAppAccount({ ...baseConfig, fetch: fetchImpl }, 'bsky');
    expect(result).toBeNull();
  });

  it('returns the account-check payload on success', async () => {
    const payload = { hasAccount: true, appName: 'Bluesky', appUrl: 'https://bsky.app' };
    const fetchImpl = jsonFetch(payload);
    const result = await checkAppAccount({ ...baseConfig, fetch: fetchImpl }, 'bsky');
    expect(result).toEqual(payload);
  });

  it('URL-encodes the app id', async () => {
    const fetchImpl = jsonFetch({ hasAccount: false, appName: '', appUrl: '' });
    await checkAppAccount({ ...baseConfig, fetch: fetchImpl }, 'app/with slash');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/reactions/account-check/app%2Fwith%20slash');
  });

  it('forwards cookie header when provided', async () => {
    const fetchImpl = jsonFetch({ hasAccount: true, appName: 'X', appUrl: 'https://x' });
    await checkAppAccount({ ...baseConfig, fetch: fetchImpl }, 'bsky', {
      cookieHeader: 'session=xyz',
    });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=xyz');
  });
});
