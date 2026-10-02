import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  fetchActivityPreferences,
  fetchSiteActivityPreset,
  updateActivityPreferences,
} from './activity-preferences.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const prefs = {
  streamCategories: { Posts: true },
  digestItemTypes: { position: true },
  sitePreset: { categories: ['Research'], tags: ['ml'] },
};

describe('fetchActivityPreferences', () => {
  it('returns the caller preferences and forwards the cookie', async () => {
    const fetchImpl = jsonFetch(prefs);
    const result = await fetchActivityPreferences(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=xyz' },
    );
    expect(result).toEqual(prefs);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity-preferences');
    expect((init.headers as Record<string, string>).cookie).toBe('session=xyz');
  });

  it('returns null on error', async () => {
    const result = await fetchActivityPreferences({ ...baseConfig, fetch: jsonFetch({}, 401) });
    expect(result).toBeNull();
  });
});

describe('updateActivityPreferences', () => {
  it('PUTs the partial update', async () => {
    const fetchImpl = jsonFetch(prefs);
    const result = await updateActivityPreferences(
      { ...baseConfig, fetch: fetchImpl },
      { sitePreset: { categories: ['Research'], tags: ['ml'] } },
    );
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity-preferences');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      sitePreset: { categories: ['Research'], tags: ['ml'] },
    });
  });

  it('returns a failure result on error', async () => {
    const result = await updateActivityPreferences(
      { ...baseConfig, fetch: jsonFetch({ error: 'InvalidRequest' }, 400) },
      { sitePreset: { categories: [], tags: [] } },
    );
    expect(result.success).toBe(false);
  });
});

describe('fetchSiteActivityPreset', () => {
  it('reads the public preset by handle or DID', async () => {
    const body = { did: 'did:plc:abc', categories: ['Research'], tags: [], active: true };
    const fetchImpl = jsonFetch(body);
    const result = await fetchSiteActivityPreset(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:abc',
    );
    expect(result).toEqual(body);
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/activity-preferences/site-preset/did%3Aplc%3Aabc');
  });

  it('returns null on error', async () => {
    const result = await fetchSiteActivityPreset(
      { ...baseConfig, fetch: jsonFetch({}, 404) },
      'nobody.example',
    );
    expect(result).toBeNull();
  });
});
