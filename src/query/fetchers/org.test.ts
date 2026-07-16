import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addOrgNotificationEmail,
  removeOrgNotificationEmail,
  requestOrgDomainChallenge,
  submitOrgClaim,
  updateOrgProfile,
  verifyOrgDomain,
} from './org.js';
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

describe('submitOrgClaim', () => {
  it('POSTs /api/org/claim with the claim body and folds the result', async () => {
    const fetchImpl = jsonFetch({
      orgDid: 'did:plc:acme',
      status: 'active',
      bindings: [],
      orgProfile: { name: 'Acme', description: null, website: null, entityRefs: ['q'] },
    });
    const result = await submitOrgClaim(
      { ...config, fetch: fetchImpl },
      { name: 'Acme', entityRefs: ['q'], authorityAck: true },
    );

    expect(result.success).toBe(true);
    expect(result.orgDid).toBe('did:plc:acme');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/org/claim');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Acme',
      entityRefs: ['q'],
      authorityAck: true,
    });
  });

  it('never throws; returns success:false on a server error', async () => {
    const fetchImpl = jsonFetch({ error: 'Forbidden', message: 'domain required' }, 403);
    const result = await submitOrgClaim(
      { ...config, fetch: fetchImpl },
      { name: 'Acme', entityRefs: ['q'], authorityAck: true },
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('domain required');
  });
});

describe('updateOrgProfile', () => {
  it('PUTs /api/org/profile', async () => {
    const fetchImpl = jsonFetch({
      ok: true,
      orgProfile: { name: 'Acme', description: null, website: null, entityRefs: ['q'] },
    });
    await updateOrgProfile({ ...config, fetch: fetchImpl }, { name: 'Acme', entityRefs: ['q'] });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/org/profile');
    expect(init.method).toBe('PUT');
  });
});

describe('org domain challenge/verify', () => {
  it('POSTs the challenge and verify endpoints', async () => {
    const challengeFetch = jsonFetch({
      domain: 'acme.com',
      txtRecordName: '_sifa-domain-verify.acme.com',
      txtRecordValue: 'token123',
    });
    const challenge = await requestOrgDomainChallenge(
      { ...config, fetch: challengeFetch },
      { domain: 'acme.com' },
    );
    expect(challenge.txtRecordValue).toBe('token123');
    expect(getCall(challengeFetch)[0]).toBe('https://api.example/api/org/domains/challenge');

    const verifyFetch = jsonFetch({ status: 'verified', domain: 'acme.com' });
    const verify = await verifyOrgDomain({ ...config, fetch: verifyFetch }, { token: 'token123' });
    expect(verify.status).toBe('verified');
    expect(getCall(verifyFetch)[0]).toBe('https://api.example/api/org/domains/verify');
  });
});

describe('org notification emails', () => {
  it('POSTs to add and DELETEs to remove', async () => {
    const addFetch = jsonFetch({ ok: true, status: 'verification_sent' }, 201);
    await addOrgNotificationEmail({ ...config, fetch: addFetch }, { email: 'ir@acme.com' });
    const [addUrl, addInit] = getCall(addFetch);
    expect(addUrl).toBe('https://api.example/api/org/notification-emails');
    expect(addInit.method).toBe('POST');

    const delFetch = jsonFetch({ ok: true, removed: 1 });
    const removed = await removeOrgNotificationEmail(
      { ...config, fetch: delFetch },
      { email: 'ir@acme.com' },
    );
    expect(removed.removed).toBe(1);
    expect(getCall(delFetch)[1].method).toBe('DELETE');
  });
});
