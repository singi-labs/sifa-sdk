import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchTypeaheadActors } from './actor.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getUrl(fetchImpl: typeof fetch, index = 0): string {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]![0];
}

describe('fetchTypeaheadActors', () => {
  it('returns an empty array without a network call for a blank query', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchTypeaheadActors({ ...baseConfig, fetch: fetchImpl }, '  ');
    expect(result).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('builds the typeahead URL, strips a leading @, and passes the limit', async () => {
    const fetchImpl = jsonFetch({ actors: [] });
    await fetchTypeaheadActors({ ...baseConfig, fetch: fetchImpl }, '@byari', 5);
    const url = getUrl(fetchImpl);
    expect(url).toContain('/api/actor/typeahead?');
    expect(url).toContain('q=byari');
    expect(url).toContain('limit=5');
  });

  it('defaults the limit to 8', async () => {
    const fetchImpl = jsonFetch({ actors: [] });
    await fetchTypeaheadActors({ ...baseConfig, fetch: fetchImpl }, 'ariel');
    expect(getUrl(fetchImpl)).toContain('limit=8');
  });

  it('returns the actors array from the response envelope', async () => {
    const actors = [{ did: 'did:plc:x', handle: 'byarielm.fyi', displayName: 'Ariel M' }];
    const fetchImpl = jsonFetch({ actors });
    const result = await fetchTypeaheadActors({ ...baseConfig, fetch: fetchImpl }, 'byari');
    expect(result).toEqual(actors);
  });

  it('returns an empty array when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'boom' }, 500);
    const result = await fetchTypeaheadActors({ ...baseConfig, fetch: fetchImpl }, 'byari');
    expect(result).toEqual([]);
  });
});
