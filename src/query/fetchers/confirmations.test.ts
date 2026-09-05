import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchGivenConfirmations, fetchPendingConfirmations } from './confirmations.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchGivenConfirmations', () => {
  it('passes through the claimer identity, including the display name', async () => {
    const confirmations = [
      {
        subjectUri: 'at://did:plc:x/id.sifa.profile.project/p1',
        claimerDid: 'did:plc:x',
        claimerHandle: 'grace.test',
        claimerDisplayName: 'Grace Hopper',
        relation: 'id.sifa.defs#projectMember',
        subjectName: 'Project Mercury',
        confirmedStale: false,
        claimWithdrawn: false,
        createdAt: '2026-07-10T00:00:00Z',
      },
    ];
    const fetchImpl = jsonFetch({ confirmations });
    const result = await fetchGivenConfirmations({ ...baseConfig, fetch: fetchImpl });
    expect(result.confirmations[0]?.claimerDisplayName).toBe('Grace Hopper');
    expect(result.confirmations[0]?.claimerHandle).toBe('grace.test');
    expect(getCall(fetchImpl)[0]).toContain('/api/confirmations/mine');
  });

  it('returns an empty list when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    expect(await fetchGivenConfirmations({ ...baseConfig, fetch: fetchImpl })).toEqual({
      confirmations: [],
    });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ confirmations: [] });
    await fetchGivenConfirmations(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=abc' },
    );
    expect((getCall(fetchImpl)[1].headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('fetchPendingConfirmations', () => {
  it('degrades to an empty page on error', async () => {
    const fetchImpl = jsonFetch({ error: 'nope' }, 500);
    expect(await fetchPendingConfirmations({ ...baseConfig, fetch: fetchImpl })).toEqual({
      confirmations: [],
    });
  });
});
