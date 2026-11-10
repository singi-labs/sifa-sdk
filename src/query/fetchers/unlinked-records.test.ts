import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchUnlinkedRecords, dismissUnlinkedRecord } from './unlinked-records.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchUnlinkedRecords', () => {
  it('returns the records from /api/profile/unlinked-records', async () => {
    const records = [
      {
        collection: 'id.sifa.profile.honor',
        rkey: 'h1',
        uri: 'at://did/id.sifa.profile.honor/h1',
        organization: 'Conf Org',
        title: 'Best Talk',
      },
    ];
    const fetchImpl = jsonFetch({ records });
    const result = await fetchUnlinkedRecords({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ records });
    expect(getCall(fetchImpl)[0]).toContain('/api/profile/unlinked-records');
  });

  it('returns an empty list when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    expect(await fetchUnlinkedRecords({ ...baseConfig, fetch: fetchImpl })).toEqual({
      records: [],
    });
  });

  it('returns an empty list when the payload has no records array', async () => {
    const fetchImpl = jsonFetch({ records: 'nope' });
    expect(await fetchUnlinkedRecords({ ...baseConfig, fetch: fetchImpl })).toEqual({
      records: [],
    });
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ records: [] });
    await fetchUnlinkedRecords(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=abc' },
    );
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('dismissUnlinkedRecord', () => {
  it('POSTs the collection and rkey to the dismiss endpoint', async () => {
    const fetchImpl = jsonFetch({ success: true });
    const result = await dismissUnlinkedRecord(
      { ...baseConfig, fetch: fetchImpl },
      { collection: 'id.sifa.profile.honor', rkey: 'h1' },
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toContain('/api/profile/unlinked-records/dismiss');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      collection: 'id.sifa.profile.honor',
      rkey: 'h1',
    });
    expect(result.success).toBe(true);
  });
});
