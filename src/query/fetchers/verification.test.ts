import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchVerificationLog } from './verification.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  // `jsonFetch` always builds a vi.fn, so the mock property exists; the cast
  // only tells TypeScript about the recorded (url, init) tuple shape.
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  const call = calls[index];
  if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
  return call;
}

describe('fetchVerificationLog', () => {
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
    expect(getCall(fetchImpl)[0]).toContain('/api/verification/did%3Aplc%3Aowner/p1');
  });

  it('returns an empty log when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'nope' }, 500);
    expect(
      await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1'),
    ).toEqual({ events: [] });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ events: [] });
    await fetchVerificationLog({ ...baseConfig, fetch: fetchImpl }, 'did:plc:owner', 'p1', {
      cookieHeader: 'session=abc',
    });
    const headers = getCall(fetchImpl)[1].headers as Record<string, string>;
    expect(headers.cookie).toBe('session=abc');
  });
});
