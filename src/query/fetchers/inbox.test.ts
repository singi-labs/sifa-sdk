import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchInboxCounts } from './inbox.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchInboxCounts', () => {
  it('returns the counts from /api/inbox/counts', async () => {
    const fetchImpl = jsonFetch({ tasks: 3, unreadNotifications: 5 });
    const result = await fetchInboxCounts({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ tasks: 3, unreadNotifications: 5 });
    expect(getCall(fetchImpl)[0]).toContain('/api/inbox/counts');
  });

  it('defaults missing fields to zero', async () => {
    const fetchImpl = jsonFetch({ tasks: 2 });
    const result = await fetchInboxCounts({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ tasks: 2, unreadNotifications: 0 });
  });

  it('returns zeros when the request fails (including unauthenticated)', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    expect(await fetchInboxCounts({ ...baseConfig, fetch: fetchImpl })).toEqual({
      tasks: 0,
      unreadNotifications: 0,
    });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ tasks: 0, unreadNotifications: 0 });
    await fetchInboxCounts({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});
