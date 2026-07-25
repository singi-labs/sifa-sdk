import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { deleteAccount, fetchWipePreview, resetProfile } from './destructive.js';
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

  // A deletion can succeed for the account while leaving records on the PDS:
  // the server wipes each collection independently and reports the survivors.
  // Without these, `success: true` is all a UI can see, and it would tell
  // someone their data is gone while it is still on their data server.
  it('surfaces which collections survived a partial wipe', async () => {
    const fetchImpl = jsonFetch({
      ok: true,
      handle: 'alice.sifa.id',
      pds: { deleted: ['id.sifa.profile.self'], remaining: ['id.sifa.meeting'], unknown: false },
    });

    const result = await deleteAccount({ ...baseConfig, fetch: fetchImpl }, true);

    expect(result.success).toBe(true);
    expect(result.pds?.remaining).toEqual(['id.sifa.meeting']);
    expect(result.pds?.deleted).toEqual(['id.sifa.profile.self']);
  });

  it('surfaces that the server could not tell what survived', async () => {
    const fetchImpl = jsonFetch({
      ok: true,
      handle: 'alice.sifa.id',
      pds: { deleted: [], remaining: [], unknown: true },
    });

    const result = await deleteAccount({ ...baseConfig, fetch: fetchImpl }, true);

    // Indistinguishable from "nothing to delete" without this flag.
    expect(result.pds?.unknown).toBe(true);
  });

  it('leaves pds undefined when the PDS was not touched', async () => {
    const fetchImpl = jsonFetch({ ok: true, handle: 'alice.sifa.id' });
    const result = await deleteAccount({ ...baseConfig, fetch: fetchImpl }, false);
    expect(result.pds).toBeUndefined();
  });
});

describe('resetProfile PDS outcome', () => {
  it('surfaces survivors on reset too', async () => {
    const fetchImpl = jsonFetch({
      ok: true,
      pds: { deleted: [], remaining: ['id.sifa.meeting'], unknown: false },
    });

    const result = await resetProfile({ ...baseConfig, fetch: fetchImpl }, true);

    expect(result.pds?.remaining).toEqual(['id.sifa.meeting']);
  });
});

describe('fetchWipePreview', () => {
  it('GETs /api/profile/wipe-preview with credentials', async () => {
    const fetchImpl = jsonFetch({ needsScopeFor: [] });
    await fetchWipePreview({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/wipe-preview');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
  });

  it('surfaces the collections the current grant cannot delete', async () => {
    const fetchImpl = jsonFetch({ needsScopeFor: ['id.sifa.meeting'] });
    const preview = await fetchWipePreview({ ...baseConfig, fetch: fetchImpl });
    expect(preview.needsScopeFor).toEqual(['id.sifa.meeting']);
  });

  // "No gaps" and "we could not look" must not read the same to a caller
  // about to delete an account: the second one cannot promise a clean wipe.
  it('surfaces that the server could not enumerate the repo', async () => {
    const fetchImpl = jsonFetch({ needsScopeFor: [], unknown: true });
    const preview = await fetchWipePreview({ ...baseConfig, fetch: fetchImpl });
    expect(preview.needsScopeFor).toEqual([]);
    expect(preview.unknown).toBe(true);
  });

  // Deliberately not swallowed into an empty gap list: a caller that cannot
  // reach the preview must warn, not proceed as if there were nothing to ask for.
  it('throws on HTTP failure rather than reporting no gaps', async () => {
    const fetchImpl = jsonFetch({ message: 'nope' }, 500);
    await expect(fetchWipePreview({ ...baseConfig, fetch: fetchImpl })).rejects.toThrow();
  });
});
