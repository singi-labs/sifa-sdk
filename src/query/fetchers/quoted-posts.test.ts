import { describe, expect, it, vi } from 'vitest';
import { type SifaApiConfig } from '../client.js';
import {
  resolveQuotedPosts,
  QUOTED_POSTS_BATCH_MAX,
  type QuotedPostResult,
} from './quoted-posts.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCalls(fetchImpl: typeof fetch): [string, RequestInit][] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return getCalls(fetchImpl)[index]!;
}

function ok(uri: string): QuotedPostResult {
  return {
    status: 'ok',
    record: {
      uri,
      cid: 'cid-' + uri,
      author: { did: 'did:plc:x', handle: 'x.test' },
      text: 'text for ' + uri,
      createdAt: '2026-03-12T00:00:00Z',
    },
  };
}

describe('resolveQuotedPosts', () => {
  it('returns an empty object when given no URIs', async () => {
    const fetchImpl = jsonFetch({});
    const result = await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, []);
    expect(result).toEqual({});
    expect(getCalls(fetchImpl)).toHaveLength(0);
  });

  it('issues a single batch POST for up to the max URIs', async () => {
    const URI = 'at://did:plc:1/app.bsky.feed.post/a';
    const fetchImpl = jsonFetch({ [URI]: ok(URI) });
    const result = await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, [URI]);
    expect(result).toEqual({ [URI]: ok(URI) });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/quoted-posts/resolve');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ uris: [URI] });
  });

  it('splits URIs beyond the max into multiple parallel batches', async () => {
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      const parsed = JSON.parse(init?.body as string) as { uris: string[] };
      const data: Record<string, QuotedPostResult> = {};
      for (const u of parsed.uris) data[u] = ok(u);
      return Promise.resolve(new Response(JSON.stringify(data), { status: 200 }));
    });
    const uris = Array.from(
      { length: QUOTED_POSTS_BATCH_MAX + 5 },
      (_, i) => `at://did:plc:1/app.bsky.feed.post/${i}`,
    );
    const result = await resolveQuotedPosts(
      { ...baseConfig, fetch: fetchImpl as unknown as typeof fetch },
      uris,
    );
    expect(Object.keys(result)).toHaveLength(QUOTED_POSTS_BATCH_MAX + 5);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('deduplicates input URIs before batching', async () => {
    const fetchImpl = jsonFetch({});
    const URI = 'at://did:plc:1/app.bsky.feed.post/a';
    await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, [URI, URI, URI]);
    const calls = getCalls(fetchImpl);
    expect(calls).toHaveLength(1);
    const parsed = JSON.parse(calls[0]![1].body as string) as { uris: string[] };
    expect(parsed.uris).toEqual([URI]);
  });

  it('returns an empty object when fetch rejects', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('network down')));
    const result = await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, [
      'at://did:plc:1/app.bsky.feed.post/a',
    ]);
    expect(result).toEqual({});
  });

  it('returns an empty object when the server returns non-2xx', async () => {
    const fetchImpl = jsonFetch({ error: 'boom' }, 500);
    const result = await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, [
      'at://did:plc:1/app.bsky.feed.post/a',
    ]);
    expect(result).toEqual({});
  });

  it('keeps successful batches when one batch fails', async () => {
    let call = 0;
    const fetchImpl = vi.fn(() => {
      call += 1;
      if (call === 1) {
        const uri = 'at://did:plc:1/app.bsky.feed.post/0';
        return Promise.resolve(new Response(JSON.stringify({ [uri]: ok(uri) }), { status: 200 }));
      }
      return Promise.resolve(new Response('{}', { status: 500 }));
    });
    const uris = Array.from(
      { length: QUOTED_POSTS_BATCH_MAX + 1 },
      (_, i) => `at://did:plc:1/app.bsky.feed.post/${i}`,
    );
    const result = await resolveQuotedPosts({ ...baseConfig, fetch: fetchImpl }, uris);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['at://did:plc:1/app.bsky.feed.post/0']?.status).toBe('ok');
  });

  it('sets Content-Type and forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({});
    await resolveQuotedPosts(
      { ...baseConfig, fetch: fetchImpl },
      ['at://did:plc:1/app.bsky.feed.post/a'],
      { cookieHeader: 'session=abc' },
    );
    const [, init] = getCall(fetchImpl);
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.cookie).toBe('session=abc');
  });
});
