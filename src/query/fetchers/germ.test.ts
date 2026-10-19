import { describe, expect, it, vi } from 'vitest';

import type { SifaApiConfig } from '../client.js';
import { fetchGermMessageLink, germRedirectPath } from './germ.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };
const OWNER = 'did:plc:owner';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit & { next?: unknown }] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit & { next?: unknown }][] } })
    .mock.calls[index]!;
}

describe('fetchGermMessageLink', () => {
  it('returns eligible for a viewer who may see the button', async () => {
    const fetchImpl = jsonFetch({ status: 'eligible' });
    const result = await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER);
    expect(result).toEqual({ status: 'eligible' });
    expect(getCall(fetchImpl)[0]).toBe(
      'https://api.example/api/profiles/did%3Aplc%3Aowner/germ-message-link',
    );
  });

  it('returns the owner status with the showButtonTo value', async () => {
    const fetchImpl = jsonFetch({ status: 'owner', showButtonTo: 'usersIFollow' });
    const result = await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER);
    expect(result).toEqual({ status: 'owner', showButtonTo: 'usersIFollow' });
  });

  it('returns null for a null body', async () => {
    const fetchImpl = jsonFetch(null);
    expect(await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER)).toBeNull();
  });

  it.each([
    { status: 'other' },
    { status: 'owner' },
    { status: 'owner', showButtonTo: 42 },
    'eligible',
  ])('returns null for an unexpected body %j', async (body) => {
    const fetchImpl = jsonFetch(body);
    expect(await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER)).toBeNull();
  });

  it('returns null on an HTTP error or network failure', async () => {
    expect(
      await fetchGermMessageLink({ ...baseConfig, fetch: jsonFetch({}, 500) }, OWNER),
    ).toBeNull();
    const failing = vi.fn(() => Promise.reject(new Error('network'))) as unknown as typeof fetch;
    expect(await fetchGermMessageLink({ ...baseConfig, fetch: failing }, OWNER)).toBeNull();
  });

  it('forwards the cookie and skips caching for a logged-in viewer', async () => {
    const fetchImpl = jsonFetch({ status: 'eligible' });
    await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER, {
      cookieHeader: 'session=abc',
    });
    const [, init] = getCall(fetchImpl);
    expect(new Headers(init.headers).get('cookie')).toBe('session=abc');
    expect(init.cache).toBe('no-store');
    expect(init.next).toBeUndefined();
  });

  it('lets a logged-out result be cached and sends no cookie', async () => {
    const fetchImpl = jsonFetch({ status: 'eligible' });
    await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER);
    const [, init] = getCall(fetchImpl);
    expect(new Headers(init.headers).get('cookie')).toBeNull();
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 900 });
  });

  it('uses a short timeout so a slow lookup cannot hold up the profile page', async () => {
    const fetchImpl = jsonFetch({ status: 'eligible' });
    await fetchGermMessageLink({ ...baseConfig, fetch: fetchImpl }, OWNER);
    expect(getCall(fetchImpl)[1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('germRedirectPath', () => {
  it('builds the click route path for a DID', () => {
    expect(germRedirectPath(OWNER)).toBe('/api/profiles/did%3Aplc%3Aowner/germ-redirect');
  });
});
