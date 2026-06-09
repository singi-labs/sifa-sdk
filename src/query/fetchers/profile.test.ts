import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchProfile } from './profile.js';
import { type SifaApiConfig } from '../client.js';

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

describe('fetchProfile', () => {
  it('GETs /api/profile/:handle and returns the profile', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:abc', handle: 'alice.example' });
    const profile = await fetchProfile({ ...config, fetch: fetchImpl }, 'alice.example');

    expect(profile).toEqual({ did: 'did:plc:abc', handle: 'alice.example' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/alice.example');
  });

  it('encodes a decoded DID exactly once', async () => {
    const fetchImpl = jsonFetch({ did: 'did:plc:abc', handle: 'alice.example' });
    await fetchProfile({ ...config, fetch: fetchImpl }, 'did:plc:abc');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/did%3Aplc%3Aabc');
  });

  it('does NOT double-encode a DID arriving already percent-encoded', async () => {
    // Reproduces the prod bug: Next.js route params arrive encoded on a hard
    // navigation, so a bare encodeURIComponent produced `did%253Aplc...`,
    // which the AppView read as a literal handle and 404'd.
    const fetchImpl = jsonFetch({ did: 'did:plc:abc', handle: 'alice.example' });
    await fetchProfile({ ...config, fetch: fetchImpl }, 'did%3Aplc%3Aabc');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/did%3Aplc%3Aabc');
  });

  it('returns null on 404', async () => {
    const fetchImpl = jsonFetch({ error: 'NotFound' }, 404);
    const profile = await fetchProfile({ ...config, fetch: fetchImpl }, 'nobody.example');
    expect(profile).toBeNull();
  });
});
