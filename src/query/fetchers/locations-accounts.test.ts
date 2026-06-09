import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { createEndorsement } from './endorsements.js';
import {
  createExternalAccount,
  deleteExternalAccount,
  fetchExternalAccounts,
  setExternalAccountPrimary,
  unsetExternalAccountPrimary,
  updateExternalAccount,
  verifyExternalAccount,
} from './external-accounts.js';
import { hideKeytraceClaim, unhideKeytraceClaim } from './keytrace-claims.js';
import { revealMarqueDomain, unrevealMarqueDomain } from './marque-domains.js';
import {
  createProfileLocation,
  deleteProfileLocation,
  updateProfileLocation,
} from './profile-locations.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('profile locations', () => {
  it('createProfileLocation POSTs to /api/profile/location and returns rkey', async () => {
    const fetchImpl = jsonFetch({ rkey: 'L1' });
    const result = await createProfileLocation(
      { ...baseConfig, fetch: fetchImpl },
      { address: { country: 'NL' }, type: 'home' },
    );
    expect(result).toEqual({ success: true, rkey: 'L1' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/location');
    expect(init.method).toBe('POST');
  });

  it('updateProfileLocation PUTs to /api/profile/location/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updateProfileLocation({ ...baseConfig, fetch: fetchImpl }, 'L1', {
      address: { country: 'NL' },
      type: 'home',
    });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/location/L1');
    expect(init.method).toBe('PUT');
  });

  it('deleteProfileLocation DELETEs the right path', async () => {
    const fetchImpl = jsonFetch({});
    await deleteProfileLocation({ ...baseConfig, fetch: fetchImpl }, 'L1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });

  it('accepts both legacy and lexicon address shapes', async () => {
    const fetchImpl = jsonFetch({ rkey: 'L2' });
    await createProfileLocation(
      { ...baseConfig, fetch: fetchImpl },
      { address: { countryCode: 'NL', city: 'Amsterdam' }, type: 'home' },
    );
    const [, init] = getCall(fetchImpl);
    const body = JSON.parse(init.body as string) as { address: Record<string, string> };
    expect(body.address.countryCode).toBe('NL');
    expect(body.address.city).toBe('Amsterdam');
  });
});

describe('external accounts', () => {
  it('fetchExternalAccounts extracts the accounts field', async () => {
    const accounts = [
      {
        rkey: 'ea1',
        platform: 'github',
        url: 'https://github.com/x',
        label: 'GitHub',
        feedUrl: null,
      },
    ];
    const fetchImpl = jsonFetch({ accounts });
    const result = await fetchExternalAccounts(
      { ...baseConfig, fetch: fetchImpl },
      'alice.sifa.id',
    );
    expect(result).toEqual(accounts);
  });

  it('fetchExternalAccounts returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchExternalAccounts({ ...baseConfig, fetch: fetchImpl }, 'alice');
    expect(result).toEqual([]);
  });

  it('createExternalAccount returns rkey + feedUrl on success', async () => {
    const fetchImpl = jsonFetch({ rkey: 'ea1', feedUrl: 'https://x/feed.xml' });
    const result = await createExternalAccount(
      { ...baseConfig, fetch: fetchImpl },
      { platform: 'github', url: 'https://github.com/x' },
    );
    expect(result.success).toBe(true);
    expect(result.rkey).toBe('ea1');
    expect(result.feedUrl).toBe('https://x/feed.xml');
  });

  it('updateExternalAccount PUTs to /api/profile/external-accounts/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updateExternalAccount({ ...baseConfig, fetch: fetchImpl }, 'ea1', {
      platform: 'github',
      url: 'https://github.com/y',
    });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/external-accounts/ea1');
    expect(init.method).toBe('PUT');
  });

  it('deleteExternalAccount DELETEs the right path', async () => {
    const fetchImpl = jsonFetch({});
    await deleteExternalAccount({ ...baseConfig, fetch: fetchImpl }, 'ea1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/external-accounts/ea1');
    expect(init.method).toBe('DELETE');
  });

  it('setExternalAccountPrimary PUTs the /primary subpath', async () => {
    const fetchImpl = jsonFetch({});
    await setExternalAccountPrimary({ ...baseConfig, fetch: fetchImpl }, 'ea1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/external-accounts/ea1/primary');
    expect(init.method).toBe('PUT');
  });

  it('unsetExternalAccountPrimary DELETEs the /primary subpath', async () => {
    const fetchImpl = jsonFetch({});
    await unsetExternalAccountPrimary({ ...baseConfig, fetch: fetchImpl }, 'ea1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });

  it('verifyExternalAccount POSTs to /verify and returns the verified flag', async () => {
    const fetchImpl = jsonFetch({ verified: true, verifiedVia: 'keytrace' });
    const result = await verifyExternalAccount({ ...baseConfig, fetch: fetchImpl }, 'ea1');
    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.verifiedVia).toBe('keytrace');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/external-accounts/ea1/verify');
    expect(init.method).toBe('POST');
  });
});

describe('endorsements', () => {
  it('createEndorsement POSTs to /api/endorsements and returns rkey', async () => {
    const fetchImpl = jsonFetch({ rkey: 'e1' });
    const result = await createEndorsement(
      { ...baseConfig, fetch: fetchImpl },
      { skillUri: 'at://did:plc:x/id.sifa.profile.skill/abc', comment: 'Great!' },
    );
    expect(result).toEqual({ success: true, rkey: 'e1' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsements');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      skillUri: 'at://did:plc:x/id.sifa.profile.skill/abc',
      comment: 'Great!',
    });
  });
});

describe('keytrace claims', () => {
  it('hideKeytraceClaim POSTs to /hide', async () => {
    const fetchImpl = jsonFetch({});
    await hideKeytraceClaim({ ...baseConfig, fetch: fetchImpl }, 'k1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/keytrace-claims/k1/hide');
    expect(init.method).toBe('POST');
  });

  it('unhideKeytraceClaim DELETEs /hide', async () => {
    const fetchImpl = jsonFetch({});
    await unhideKeytraceClaim({ ...baseConfig, fetch: fetchImpl }, 'k1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });
});

describe('marque domains', () => {
  it('revealMarqueDomain POSTs to /reveal with the domain URL-encoded', async () => {
    const fetchImpl = jsonFetch({});
    await revealMarqueDomain({ ...baseConfig, fetch: fetchImpl }, 'sweetbee.gay');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/marque-domains/sweetbee.gay/reveal');
    expect(init.method).toBe('POST');
  });

  it('unrevealMarqueDomain DELETEs /reveal', async () => {
    const fetchImpl = jsonFetch({});
    await unrevealMarqueDomain({ ...baseConfig, fetch: fetchImpl }, 'sweetbee.gay');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });
});
