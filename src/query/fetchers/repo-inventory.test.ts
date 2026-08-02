import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { deleteRepoRecords, fetchRepoInventory, repoExportUrl } from './repo-inventory.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchRepoInventory', () => {
  it('GETs /api/me/repo-inventory with credentials', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:x', fetchedAt: '', groups: [], totalRecords: 0 });
    await fetchRepoInventory({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/repo-inventory');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
  });

  // An empty inventory is a claim that Sifa stored nothing about this person.
  // A request that never arrived is not entitled to make it.
  it('throws on HTTP failure rather than reporting an empty repo', async () => {
    const fetchImpl = jsonFetch({ message: 'nope' }, 500);
    await expect(fetchRepoInventory({ ...baseConfig, fetch: fetchImpl })).rejects.toThrow();
  });

  it('surfaces collections the server could not list', async () => {
    const fetchImpl = jsonFetch({
      did: 'did:plc:x',
      fetchedAt: '2026-08-02T00:00:00.000Z',
      groups: [],
      totalRecords: 0,
      unreadableCollections: ['id.sifa.meeting'],
    });
    const inventory = await fetchRepoInventory({ ...baseConfig, fetch: fetchImpl });
    expect(inventory.unreadableCollections).toEqual(['id.sifa.meeting']);
  });
});

describe('deleteRepoRecords', () => {
  it('POSTs /api/me/repo-delete with the collection and rkeys', async () => {
    const fetchImpl = jsonFetch({ collection: 'id.sifa.profile.skill', results: [] });
    await deleteRepoRecords(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'id.sifa.profile.skill', rkeys: ['a', 'b'] },
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/me/repo-delete');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      collection: 'id.sifa.profile.skill',
      rkeys: ['a', 'b'],
    });
  });

  it('passes all: true through for a whole-collection delete', async () => {
    const fetchImpl = jsonFetch({ collection: 'id.sifa.profile.skill', results: [] });
    await deleteRepoRecords(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'id.sifa.profile.skill', all: true },
    );
    const [, init] = getCall(fetchImpl);
    expect(JSON.parse(init.body as string)).toEqual({
      collection: 'id.sifa.profile.skill',
      all: true,
    });
  });

  // success is about the request, not the data. A caller that reads it as
  // "the records are gone" would tell four of five users the truth.
  it('reports per-record outcomes alongside a successful request', async () => {
    const fetchImpl = jsonFetch({
      collection: 'id.sifa.profile.skill',
      results: [
        { rkey: 'a', outcome: 'deleted' },
        { rkey: 'b', outcome: 'remaining' },
        { rkey: 'c', outcome: 'unknown' },
      ],
    });
    const result = await deleteRepoRecords(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'id.sifa.profile.skill', rkeys: ['a', 'b', 'c'] },
    );
    expect(result.success).toBe(true);
    expect(result.results.filter((r) => r.outcome !== 'deleted')).toEqual([
      { rkey: 'b', outcome: 'remaining' },
      { rkey: 'c', outcome: 'unknown' },
    ]);
  });

  it('surfaces a missing scope instead of a bare failure', async () => {
    const fetchImpl = jsonFetch({
      collection: 'id.sifa.meeting',
      results: [],
      needsScopeUpgrade: { scope: 'repo:id.sifa.meeting?action=delete', collections: [] },
    });
    const result = await deleteRepoRecords(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'id.sifa.meeting', all: true },
    );
    expect(result.needsScopeUpgrade?.scope).toBe('repo:id.sifa.meeting?action=delete');
  });

  it('returns success: false on HTTP failure', async () => {
    const fetchImpl = jsonFetch({ message: 'Refused' }, 400);
    const result = await deleteRepoRecords(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'app.bsky.feed.post', all: true },
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Refused');
  });
});

describe('repoExportUrl', () => {
  it('builds the download URL from the configured base', () => {
    expect(repoExportUrl(baseConfig)).toBe('https://api.example/api/me/repo-export');
  });
});
