import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { castRoadmapItemVote, fetchRoadmap, retractRoadmapItemVote } from './roadmap.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };
const ITEM = { did: 'did:plc:op', rkey: '3abc' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() =>
    Promise.resolve(
      status === 204
        ? new Response(null, { status })
        : new Response(JSON.stringify(body), { status }),
    ),
  );
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const item = {
  uri: 'at://did:plc:op/app.userinput.discussion/3abc',
  did: 'did:plc:op',
  rkey: '3abc',
  title: 'Mobile apps',
  body: 'Native apps.',
  tags: ['feature'],
  size: 'epic',
  status: 'later',
  votable: true,
  votes: { count: 2, voters: [{ did: 'did:plc:a' }] },
  createdAt: '2026-07-01T00:00:00.000Z',
  viewerVoted: false,
};

describe('fetchRoadmap', () => {
  it('returns the items on success', async () => {
    const fetchImpl = jsonFetch({ items: [item] });
    const result = await fetchRoadmap({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual([item]);
    expect(getCall(fetchImpl)[0]).toBe('https://api.example/api/roadmap');
  });

  it('forwards the cookie header for server-side calls', async () => {
    const fetchImpl = jsonFetch({ items: [] });
    await fetchRoadmap({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const headers = new Headers(getCall(fetchImpl)[1].headers);
    expect(headers.get('cookie')).toBe('session=abc');
  });

  it('returns null on error so the page can tell an outage from an empty roadmap', async () => {
    expect(await fetchRoadmap({ ...baseConfig, fetch: jsonFetch({}, 500) })).toBeNull();
    expect(await fetchRoadmap({ ...baseConfig, fetch: jsonFetch({ nope: 1 }) })).toBeNull();
  });
});

describe('castRoadmapItemVote', () => {
  it('POSTs to the item vote route with did and rkey encoded', async () => {
    const fetchImpl = jsonFetch({ uri: 'at://did:plc:me/app.userinput.upvote/3abc', rkey: '3abc' });
    const result = await castRoadmapItemVote({ ...baseConfig, fetch: fetchImpl }, ITEM);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/items/did%3Aplc%3Aop/3abc/vote');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect(result).toEqual({
      ok: true,
      data: { uri: 'at://did:plc:me/app.userinput.upvote/3abc', rkey: '3abc' },
    });
  });

  it('surfaces ScopeInsufficient', async () => {
    const fetchImpl = jsonFetch(
      { error: 'ScopeInsufficient', requiredScope: 'app.userinput.upvote' },
      403,
    );
    expect(await castRoadmapItemVote({ ...baseConfig, fetch: fetchImpl }, ITEM)).toEqual({
      ok: false,
      error: { type: 'scope_insufficient', requiredScope: 'app.userinput.upvote' },
    });
  });

  it('returns a generic error otherwise', async () => {
    const fetchImpl = jsonFetch({ error: 'NotVotable' }, 409);
    expect(await castRoadmapItemVote({ ...baseConfig, fetch: fetchImpl }, ITEM)).toEqual({
      ok: false,
      error: { type: 'error' },
    });
  });
});

describe('retractRoadmapItemVote', () => {
  it('DELETEs the item vote route', async () => {
    const fetchImpl = jsonFetch(null, 204);
    const result = await retractRoadmapItemVote({ ...baseConfig, fetch: fetchImpl }, ITEM);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/items/did%3Aplc%3Aop/3abc/vote');
    expect(init.method).toBe('DELETE');
    expect(result.success).toBe(true);
  });
});
