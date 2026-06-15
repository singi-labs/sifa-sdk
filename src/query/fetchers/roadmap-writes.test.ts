import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { castRoadmapVote, retractRoadmapVote } from './roadmap.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('castRoadmapVote', () => {
  it('returns ok with the created record on success', async () => {
    const fetchImpl = jsonFetch({ uri: 'at://did:plc:me/app.userinput.upvote/abc', rkey: 'abc' });
    const result = await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result).toEqual({
      ok: true,
      data: { uri: 'at://did:plc:me/app.userinput.upvote/abc', rkey: 'abc' },
    });
  });

  it('detects ScopeInsufficient on 403 and surfaces requiredScope', async () => {
    const fetchImpl = jsonFetch(
      { error: 'ScopeInsufficient', requiredScope: 'app.userinput.upvote' },
      403,
    );
    const result = await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result).toEqual({
      ok: false,
      error: { type: 'scope_insufficient', requiredScope: 'app.userinput.upvote' },
    });
  });

  it('returns generic error for non-ScopeInsufficient failures', async () => {
    const fetchImpl = jsonFetch({ message: 'Server error' }, 500);
    const result = await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result).toEqual({ ok: false, error: { type: 'error' } });
  });

  it('returns generic error when fetch throws', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch;
    const result = await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result).toEqual({ ok: false, error: { type: 'error' } });
  });

  it('POSTs to /api/roadmap/votes/:key with the key URL-encoded', async () => {
    const fetchImpl = jsonFetch({ uri: 'at://x', rkey: 'r1' });
    await castRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'event/RSVP');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/votes/event%2FRSVP');
    expect(init.method).toBe('POST');
  });
});

describe('retractRoadmapVote', () => {
  it('returns success on a 2xx response', async () => {
    const fetchImpl = jsonFetch({}, 200);
    const result = await retractRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result.success).toBe(true);
  });

  it('returns a structured failure on error', async () => {
    const fetchImpl = jsonFetch({ message: 'nope' }, 500);
    const result = await retractRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'jobProfiles');
    expect(result.success).toBe(false);
    expect(result.error).toBe('nope');
  });

  it('DELETEs /api/roadmap/votes/:key with the key URL-encoded', async () => {
    const fetchImpl = jsonFetch({}, 200);
    await retractRoadmapVote({ ...baseConfig, fetch: fetchImpl }, 'event/RSVP');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/roadmap/votes/event%2FRSVP');
    expect(init.method).toBe('DELETE');
  });
});
