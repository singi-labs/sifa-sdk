import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchUserSettings, updateUserSettings, UserSettingsSchema } from './user-settings.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200) {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
}

function getCall(fetchImpl: ReturnType<typeof jsonFetch>) {
  const call = fetchImpl.mock.calls[0];
  if (!call) throw new Error('fetch was not called');
  const [input, init] = call;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return { url, init: init ?? {} };
}

describe('UserSettingsSchema', () => {
  it('defaults showCitationCounts to off when an older API omits it', () => {
    const parsed = UserSettingsSchema.parse({ respectBskyBlocks: true, autoLinkCompanies: true });
    expect(parsed.showCitationCounts).toBe(false);
  });
});

describe('fetchUserSettings', () => {
  it('reads /api/settings with credentials', async () => {
    const fetchImpl = jsonFetch({
      respectBskyBlocks: true,
      autoLinkCompanies: false,
      showCitationCounts: true,
    });
    const settings = await fetchUserSettings({ ...baseConfig, fetch: fetchImpl });
    expect(settings).toEqual({
      respectBskyBlocks: true,
      autoLinkCompanies: false,
      showCitationCounts: true,
    });
    const { url, init } = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/settings');
    expect(init.credentials).toBe('include');
  });

  it('forwards a cookie header for server-side reads', async () => {
    const fetchImpl = jsonFetch({ respectBskyBlocks: true, autoLinkCompanies: true });
    await fetchUserSettings({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const headers = new Headers(getCall(fetchImpl).init.headers);
    expect(headers.get('cookie')).toBe('session=abc');
  });

  it('returns null when signed out or on a malformed body', async () => {
    expect(
      await fetchUserSettings({ ...baseConfig, fetch: jsonFetch({ error: 'Unauthorized' }, 401) }),
    ).toBeNull();
    expect(
      await fetchUserSettings({ ...baseConfig, fetch: jsonFetch({ respectBskyBlocks: 'yes' }) }),
    ).toBeNull();
  });
});

describe('updateUserSettings', () => {
  it('PATCHes only the changed preference and returns the saved settings', async () => {
    const fetchImpl = jsonFetch({
      respectBskyBlocks: true,
      autoLinkCompanies: true,
      showCitationCounts: true,
    });
    const result = await updateUserSettings(
      { ...baseConfig, fetch: fetchImpl },
      { showCitationCounts: true },
    );
    expect(result?.showCitationCounts).toBe(true);
    const { url, init } = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/settings');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ showCitationCounts: true });
  });

  it('returns null when the save fails', async () => {
    const result = await updateUserSettings(
      { ...baseConfig, fetch: jsonFetch({ error: 'BadRequest' }, 400) },
      { showCitationCounts: true },
    );
    expect(result).toBeNull();
  });
});
