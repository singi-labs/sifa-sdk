import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchAccounts, switchAccount } from './accounts.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchAccounts', () => {
  it('returns the accounts array from the response envelope', async () => {
    const accounts = [
      { did: 'did:plc:a', handle: 'a.test', displayName: 'A', avatarUrl: null, active: true },
    ];
    const fetchImpl = jsonFetch({ accounts });
    const result = await fetchAccounts({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(accounts);
    expect(getCall(fetchImpl)[0]).toContain('/api/auth/accounts');
  });

  it('passes through the org logo blob CID for company accounts', async () => {
    const accounts = [
      {
        did: 'did:plc:org',
        handle: 'singi.dev',
        displayName: 'Singi Labs',
        avatarUrl: 'https://cdn.example/avatar.jpg',
        orgLogoBlob: 'bafyreiorglogocid',
        active: false,
      },
    ];
    const fetchImpl = jsonFetch({ accounts });
    const result = await fetchAccounts({ ...baseConfig, fetch: fetchImpl });
    expect(result[0]!.orgLogoBlob).toBe('bafyreiorglogocid');
  });

  it('returns [] when the request fails (including unauthenticated)', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    expect(await fetchAccounts({ ...baseConfig, fetch: fetchImpl })).toEqual([]);
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ accounts: [] });
    await fetchAccounts({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('switchAccount', () => {
  it('POSTs the DID to /oauth/switch', async () => {
    const fetchImpl = jsonFetch({ status: 'ok', did: 'did:plc:a' });
    await switchAccount({ ...baseConfig, fetch: fetchImpl }, 'did:plc:a');
    const [url, init] = getCall(fetchImpl);
    expect(url).toContain('/oauth/switch');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ did: 'did:plc:a' });
  });
});
