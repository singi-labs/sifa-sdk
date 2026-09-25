import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRpgStatus } from './rpg.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: undefined };

const sample = {
  hasCharacter: true,
  canWriteItems: false,
  items: [
    {
      id: 'sifa_power_suit',
      title: 'Power Suit',
      description: '',
      category: 'tops',
      earned: true,
      state: 'earned',
      iconUrl: null,
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchRpgStatus', () => {
  it('GETs /api/rpg/status with the session cookie and no caching', async () => {
    const fetchImpl = jsonFetch(sample);
    const result = await fetchRpgStatus({ ...config, fetch: fetchImpl });

    expect(result).toEqual(sample);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/rpg/status');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
  });

  it('forwards cookieHeader as the cookie header', async () => {
    const fetchImpl = jsonFetch(sample);
    await fetchRpgStatus({ ...config, fetch: fetchImpl }, { cookieHeader: 'sid=abc' });
    const [, init] = getCall(fetchImpl);
    expect(new Headers(init.headers).get('cookie')).toBe('sid=abc');
  });

  it('rejects a malformed response body (Zod validation)', async () => {
    const bad = { ...sample, items: [{ ...sample.items[0], state: 'stolen' }] };
    const fetchImpl = jsonFetch(bad);
    await expect(fetchRpgStatus({ ...config, fetch: fetchImpl })).rejects.toThrow();
  });
});
