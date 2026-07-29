import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { confirmEndorsement, createEndorsement } from './endorsements.js';
import { dismissEndorsement, fetchPendingEndorsements } from './endorsement-inbox.js';
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

/** 204 carries no body; Response rejects one, so build it explicitly. */
function noContentFetch(): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
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
  const endorsementInput = {
    subjectDid: 'did:plc:x',
    skillUri: 'at://did:plc:x/id.sifa.profile.skill/abc',
    skillCid: 'bafyreiabc',
    skillName: 'Community Organizing',
    comment: 'Great!',
  };

  it('createEndorsement POSTs to /api/endorsement and returns rkey', async () => {
    const fetchImpl = jsonFetch({ rkey: 'e1' });
    const result = await createEndorsement({ ...baseConfig, fetch: fetchImpl }, endorsementInput);
    expect(result).toEqual({ success: true, rkey: 'e1' });
    const [url, init] = getCall(fetchImpl);
    // Singular. The AppView has no /api/endorsements collection endpoint.
    expect(url).toBe('https://api.example/api/endorsement');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(endorsementInput);
  });

  it('createEndorsement sends the strongRef fields the AppView requires', async () => {
    const fetchImpl = jsonFetch({ rkey: 'e1' });
    await createEndorsement({ ...baseConfig, fetch: fetchImpl }, endorsementInput);
    const body = JSON.parse(getCall(fetchImpl)[1].body as string) as Record<string, string>;
    // Dropping any of these makes the AppView reject the write with a 400.
    expect(body.subjectDid).toBe('did:plc:x');
    expect(body.skillCid).toBe('bafyreiabc');
    expect(body.skillName).toBe('Community Organizing');
  });

  it('confirmEndorsement omits the CID when the caller has none', async () => {
    // The AppView resolves it. Sending a placeholder or another record's CID
    // would write a corrupt strongRef.
    const fetchImpl = jsonFetch({ rkey: 'c1' });
    await confirmEndorsement(
      { ...baseConfig, fetch: fetchImpl },
      { endorsementUri: 'at://did:plc:endorser/id.sifa.endorsement/abc' },
    );
    const body = JSON.parse(getCall(fetchImpl)[1].body as string) as Record<string, string>;
    expect(body.endorsementUri).toBe('at://did:plc:endorser/id.sifa.endorsement/abc');
    expect('endorsementCid' in body).toBe(false);
  });

  it('confirmEndorsement POSTs the strongRef to /api/endorsement/confirm', async () => {
    const fetchImpl = jsonFetch({ rkey: 'c1' });
    const result = await confirmEndorsement(
      { ...baseConfig, fetch: fetchImpl },
      {
        endorsementUri: 'at://did:plc:endorser/id.sifa.endorsement/abc',
        endorsementCid: 'bafyreiabc',
      },
    );
    expect(result).toEqual({ success: true, rkey: 'c1' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsement/confirm');
    expect(init.method).toBe('POST');
  });
});

describe('endorsement inbox', () => {
  it('fetchPendingEndorsements reads the session-scoped inbox with credentials', async () => {
    const pending = {
      endorserDid: 'did:plc:endorser',
      endorserHandle: 'alice.sifa.id',
      rkey: 'abc',
      uri: 'at://did:plc:endorser/id.sifa.endorsement/abc',
      skillUri: 'at://did:plc:x/id.sifa.profile.skill/s1',
      skillCid: 'bafyreis1',
      skillName: 'Community Organizing',
      createdAt: '2026-07-20T00:00:00.000Z',
    };
    const fetchImpl = jsonFetch({ endorsements: [pending] });
    const result = await fetchPendingEndorsements({ ...baseConfig, fetch: fetchImpl });
    expect(result.endorsements).toEqual([pending]);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsements/pending');
    expect(init.credentials).toBe('include');
  });

  it('tolerates a pending endorsement with no endorser handle', async () => {
    // The endorser need not be a Sifa user.
    const fetchImpl = jsonFetch({
      endorsements: [
        {
          endorserDid: 'did:plc:endorser',
          rkey: 'abc',
          uri: 'at://did:plc:endorser/id.sifa.endorsement/abc',
          skillUri: 'at://did:plc:x/id.sifa.profile.skill/s1',
          skillCid: 'bafyreis1',
          skillName: 'Community Organizing',
          createdAt: '2026-07-20T00:00:00.000Z',
        },
      ],
    });
    const result = await fetchPendingEndorsements({ ...baseConfig, fetch: fetchImpl });
    expect(result.endorsements[0]?.endorserHandle).toBeUndefined();
  });

  it('fetchPendingEndorsements returns an empty page when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'Unauthorized' }, 401);
    const result = await fetchPendingEndorsements({ ...baseConfig, fetch: fetchImpl });
    // A signed-out or broken inbox degrades to "nothing pending" rather than
    // breaking whichever surface is hosting it.
    expect(result).toEqual({ endorsements: [] });
  });

  it('fetchPendingEndorsements passes the cursor through for paging', async () => {
    const fetchImpl = jsonFetch({ endorsements: [], cursor: '2026-07-19T00:00:00.000Z' });
    const result = await fetchPendingEndorsements({ ...baseConfig, fetch: fetchImpl });
    expect(result.cursor).toBe('2026-07-19T00:00:00.000Z');
  });

  it('dismissEndorsement POSTs the endorsement coordinates', async () => {
    const fetchImpl = noContentFetch();
    const result = await dismissEndorsement(
      { ...baseConfig, fetch: fetchImpl },
      { endorserDid: 'did:plc:endorser', rkey: 'abc' },
    );
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/endorsement/dismiss');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      endorserDid: 'did:plc:endorser',
      rkey: 'abc',
    });
  });

  it('dismissEndorsement reports failure without throwing', async () => {
    const fetchImpl = jsonFetch({ message: 'Nope' }, 500);
    const result = await dismissEndorsement(
      { ...baseConfig, fetch: fetchImpl },
      { endorserDid: 'did:plc:endorser', rkey: 'abc' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Nope');
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
