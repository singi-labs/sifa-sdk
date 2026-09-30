import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchVerificationLog, VERIFICATION_EVENT_KINDS } from './verification.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200) {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
}

/** The (url, init) pair of the n-th recorded call, or a clear failure. */
function getCall(fetchImpl: ReturnType<typeof jsonFetch>, index = 0) {
  const call = fetchImpl.mock.calls[index];
  if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
  const [input, init] = call;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return { url, init: init ?? {} };
}

describe('fetchVerificationLog', () => {
  it('reserves the nine event kinds the AppView writes', () => {
    expect(VERIFICATION_EVENT_KINDS).toHaveLength(9);
    expect(VERIFICATION_EVENT_KINDS).toContain('org_confirmed');
  });

  it('reads the log for one position and passes entries through', async () => {
    const events = [
      {
        id: 2,
        kind: 'org_confirmed',
        occurredAt: '2026-09-30T10:00:00.000Z',
        entityId: 5,
        emailDomain: null,
        meta: {},
      },
      {
        id: 1,
        kind: 'mailbox_verified',
        occurredAt: '2026-09-01T10:00:00.000Z',
        entityId: null,
        emailDomain: 'acme.example',
        emailAddress: 'jane@acme.example',
        meta: {},
      },
    ];
    const fetchImpl = jsonFetch({ events });
    const result = await fetchVerificationLog(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:owner',
      'p1',
    );
    expect(result.events).toHaveLength(2);
    expect(result.events[0]?.kind).toBe('org_confirmed');
    expect(result.events[1]?.emailAddress).toBe('jane@acme.example');
    expect(getCall(fetchImpl).url).toContain('/api/verification/did%3Aplc%3Aowner/p1');
  });

  it('keeps a kind it does not know yet, so an AppView addition never breaks the panel', async () => {
    const fetchImpl = jsonFetch({
      events: [{ id: 9, kind: 'something_new', occurredAt: '2026-09-30T10:00:00.000Z' }],
    });
    const result = await fetchVerificationLog(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:owner',
      'p1',
    );
    expect(result.events[0]?.kind).toBe('something_new');
    expect(result.events[0]?.entityId).toBeNull();
    expect(result.events[0]?.meta).toEqual({});
  });

  it.each([404, 500])('returns an empty log on a %d response', async (status) => {
    const fetchImpl = jsonFetch({ error: 'nope' }, status);
    expect(
      await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1'),
    ).toEqual({ events: [] });
  });

  it('returns an empty log when the body is not the expected shape', async () => {
    const fetchImpl = jsonFetch({ events: 'not-an-array' });
    expect(
      await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1'),
    ).toEqual({ events: [] });
  });

  it('returns an empty log when fetch itself rejects', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('offline')));
    expect(
      await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1'),
    ).toEqual({ events: [] });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ events: [] });
    await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1', {
      cookieHeader: 'session=abc',
    });
    expect(new Headers(getCall(fetchImpl).init.headers).get('cookie')).toBe('session=abc');
  });
});
