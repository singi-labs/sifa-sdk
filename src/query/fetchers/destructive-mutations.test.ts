import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { deleteAccount, resetProfile } from './destructive.js';
import { createReaction, deleteReaction } from './reactions.js';
import { castRoadmapVote, retractRoadmapVote } from './roadmap.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('createReaction', () => {
  it('returns { ok: true, data } on success', async () => {
    const fetchImpl = jsonFetch({ uri: 'at://x', rkey: 'r1' });
    const result = await createReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result).toEqual({ ok: true, data: { uri: 'at://x', rkey: 'r1' } });
  });

  it('detects ScopeInsufficient errors on 403 and surfaces requiredScope', async () => {
    const fetchImpl = jsonFetch(
      { error: 'ScopeInsufficient', requiredScope: 'app.bsky.feed.like' },
      403,
    );
    const result = await createReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result).toEqual({
      ok: false,
      error: { type: 'scope_insufficient', requiredScope: 'app.bsky.feed.like' },
    });
  });

  it('returns generic error for non-ScopeInsufficient failures', async () => {
    const fetchImpl = jsonFetch({ message: 'Server error' }, 500);
    const result = await createReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result).toEqual({ ok: false, error: { type: 'error' } });
  });

  it('returns generic error when fetch throws', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch;
    const result = await createReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result).toEqual({ ok: false, error: { type: 'error' } });
  });

  it('POSTs the body with targetUri, appId, and targetCid', async () => {
    const fetchImpl = jsonFetch({ uri: 'at://x', rkey: 'r1' });
    await createReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky', 'bafy123');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/reactions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      targetUri: 'at://target',
      appId: 'bsky',
      targetCid: 'bafy123',
    });
  });
});

describe('deleteReaction', () => {
  it('DELETEs /api/reactions with { targetUri, appId }', async () => {
    const fetchImpl = jsonFetch({});
    const result = await deleteReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/reactions');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ targetUri: 'at://target', appId: 'bsky' });
  });

  it('returns { success: false, error } on HTTP failure', async () => {
    const fetchImpl = jsonFetch({ message: 'Not found' }, 404);
    const result = await deleteReaction({ ...baseConfig, fetch: fetchImpl }, 'at://target', 'bsky');
    expect(result).toEqual({ success: false, error: 'Not found' });
  });
});

describe('roadmap vote mutations', () => {
  it('castRoadmapVote POSTs to /api/roadmap/votes/<key>', async () => {
    const fetchImpl = jsonFetch({});
    await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'feature-x');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/votes/feature-x');
    expect(init.method).toBe('POST');
  });

  it('retractRoadmapVote DELETEs /api/roadmap/votes/<key>', async () => {
    const fetchImpl = jsonFetch({});
    await retractRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'feature-x');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });

  it('URL-encodes the vote key', async () => {
    const fetchImpl = jsonFetch({});
    await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'feature/x y');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/votes/feature%2Fx%20y');
  });
});

describe('resetProfile', () => {
  it('DELETEs /api/profile/reset with { deletePdsData: true }', async () => {
    const fetchImpl = jsonFetch({});
    await resetProfile({ ...baseConfig, fetch: fetchImpl }, true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/reset');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ deletePdsData: true });
  });

  it('passes deletePdsData: false', async () => {
    const fetchImpl = jsonFetch({});
    await resetProfile({ ...baseConfig, fetch: fetchImpl }, false);
    const [, init] = getCall(fetchImpl);
    expect(JSON.parse(init.body as string)).toEqual({ deletePdsData: false });
  });
});

describe('deleteAccount', () => {
  it('DELETEs /api/profile/account and returns the handle', async () => {
    const fetchImpl = jsonFetch({ ok: true, handle: 'alice.sifa.id' });
    const result = await deleteAccount({ ...baseConfig, fetch: fetchImpl }, true);
    expect(result.success).toBe(true);
    expect(result.handle).toBe('alice.sifa.id');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/account');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ deletePdsData: true });
  });

  it('preserves pdsHost on PDS-side failure', async () => {
    const fetchImpl = jsonFetch({ message: 'PDS unreachable', pdsHost: 'eurosky.social' }, 503);
    const result = await deleteAccount({ ...baseConfig, fetch: fetchImpl }, true);
    expect(result.success).toBe(false);
    expect(result.pdsHost).toBe('eurosky.social');
  });
});
