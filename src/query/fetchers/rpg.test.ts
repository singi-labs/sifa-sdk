import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRpgClaimable, fetchRpgStatus, RpgStatusResponseSchema } from './rpg.js';
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
      id: 'sifa_suit',
      title: 'Sifa Suit',
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

    expect(result).toEqual({
      ...sample,
      canCollect: false,
      items: sample.items.map((i) => ({ ...i, worn: false })),
    });
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

  it('defaults canCollect to false when an older API omits it', () => {
    expect(RpgStatusResponseSchema.parse(sample).canCollect).toBe(false);
    expect(RpgStatusResponseSchema.parse({ ...sample, canCollect: true }).canCollect).toBe(true);
  });

  it('keeps worn for claimed items and defaults it to false when an older API omits it', () => {
    const [item] = sample.items;
    const worn = { ...sample, items: [{ ...item, state: 'claimed', worn: true }] };
    expect(RpgStatusResponseSchema.parse(worn).items[0]?.worn).toBe(true);
    expect(RpgStatusResponseSchema.parse(sample).items[0]?.worn).toBe(false);
  });

  it('rejects a malformed response body (Zod validation)', async () => {
    const bad = { ...sample, items: [{ ...sample.items[0], state: 'stolen' }] };
    const fetchImpl = jsonFetch(bad);
    await expect(fetchRpgStatus({ ...config, fetch: fetchImpl })).rejects.toThrow();
  });
});

describe('fetchRpgClaimable', () => {
  it('GETs /api/rpg/claimable with the session cookie and no caching', async () => {
    const fetchImpl = jsonFetch({ count: 2 });
    const result = await fetchRpgClaimable({ ...config, fetch: fetchImpl });

    expect(result).toEqual({ count: 2 });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/rpg/claimable');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
  });

  it('forwards cookieHeader as the cookie header', async () => {
    const fetchImpl = jsonFetch({ count: 0 });
    await fetchRpgClaimable({ ...config, fetch: fetchImpl }, { cookieHeader: 'sid=abc' });
    const [, init] = getCall(fetchImpl);
    expect(new Headers(init.headers).get('cookie')).toBe('sid=abc');
  });

  it('degrades to a zero count when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'Unauthorized' }, 401);
    expect(await fetchRpgClaimable({ ...config, fetch: fetchImpl })).toEqual({ count: 0 });
  });

  it('degrades to a zero count on a malformed body', async () => {
    const fetchImpl = jsonFetch({ count: -1 });
    expect(await fetchRpgClaimable({ ...config, fetch: fetchImpl })).toEqual({ count: 0 });
  });
});
