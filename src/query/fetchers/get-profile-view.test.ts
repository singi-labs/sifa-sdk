import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchGetProfileView } from './get-profile-view.js';
import { ApiError, type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchGetProfileView', () => {
  it('GETs /xrpc/id.sifa.getProfileView with the actor and returns the view', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:abc', handle: 'alice.example' });
    const view = await fetchGetProfileView({ ...config, fetch: fetchImpl }, 'alice.example');

    expect(view).toEqual({ did: 'did:plc:abc', handle: 'alice.example' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/xrpc/id.sifa.getProfileView?actor=alice.example');
  });

  it('encodes a DID actor exactly once', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:abc', handle: 'alice.example' });
    await fetchGetProfileView({ ...config, fetch: fetchImpl }, 'did:plc:abc');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/xrpc/id.sifa.getProfileView?actor=did%3Aplc%3Aabc');
  });

  it('returns null on ProfileNotFound (400)', async () => {
    const fetchImpl = jsonFetch({ error: 'ProfileNotFound' }, 400);
    const view = await fetchGetProfileView({ ...config, fetch: fetchImpl }, 'nobody.invalid');
    expect(view).toBeNull();
  });

  it('throws ApiError on other non-2xx responses', async () => {
    const fetchImpl = jsonFetch({ error: 'InternalServerError' }, 500);
    await expect(
      fetchGetProfileView({ ...config, fetch: fetchImpl }, 'alice.example'),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
