import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchReciprocityCandidate } from './reciprocity.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[0]!;
}

const CANDIDATE = {
  did: 'did:plc:noor',
  handle: 'noor.eu',
  displayName: 'Noor Ahmed',
  avatar: 'https://cdn.example/noor.jpg',
  skills: [{ name: 'Postgres', uri: 'at://did:plc:noor/id.sifa.profile.skill/s1', cid: 'bafy1' }],
};

describe('fetchReciprocityCandidate', () => {
  it('unwraps the candidate and sends credentials', async () => {
    const fetchImpl = jsonFetch({ candidate: CANDIDATE });
    const result = await fetchReciprocityCandidate({ ...baseConfig, fetch: fetchImpl });

    expect(result?.handle).toBe('noor.eu');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsements/reciprocity-candidate');
    expect(init.credentials).toBe('include');
  });

  it('returns null when there is nobody left to suggest', async () => {
    // A real state, not an error: everyone eligible has been dismissed.
    const fetchImpl = jsonFetch({ candidate: null });
    expect(await fetchReciprocityCandidate({ ...baseConfig, fetch: fetchImpl })).toBeNull();
  });

  it('returns null on failure rather than throwing', async () => {
    // A broken suggestion must not take the homepage down with it.
    const fetchImpl = jsonFetch({ error: 'Unauthorized' }, 401);
    expect(await fetchReciprocityCandidate({ ...baseConfig, fetch: fetchImpl })).toBeNull();
  });

  it('tolerates a skill with no CID', async () => {
    const fetchImpl = jsonFetch({
      candidate: { ...CANDIDATE, skills: [{ name: 'Rust', uri: 'at://x/y/z' }] },
    });
    const result = await fetchReciprocityCandidate({ ...baseConfig, fetch: fetchImpl });
    expect(result?.skills[0]?.cid).toBeUndefined();
  });
});
