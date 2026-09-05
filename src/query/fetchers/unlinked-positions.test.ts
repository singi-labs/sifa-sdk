import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchUnlinkedPositions } from './unlinked-positions.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchUnlinkedPositions', () => {
  it('returns the positions from /api/positions/unlinked', async () => {
    const positions = [{ rkey: 'r1', uri: 'at://did/coll/r1', company: 'Acme', title: 'Engineer' }];
    const fetchImpl = jsonFetch({ positions });
    const result = await fetchUnlinkedPositions({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ positions });
    expect(getCall(fetchImpl)[0]).toContain('/api/positions/unlinked');
  });

  it('returns an empty list when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    expect(await fetchUnlinkedPositions({ ...baseConfig, fetch: fetchImpl })).toEqual({
      positions: [],
    });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ positions: [] });
    await fetchUnlinkedPositions(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=abc' },
    );
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});
