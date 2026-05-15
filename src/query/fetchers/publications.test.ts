import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  bulkHideStandardPublications,
  bulkUnhideStandardPublications,
  hideOrcidPublication,
  hideSifaPublication,
  hideStandardPublication,
  refreshOrcidPublications,
  unhideOrcidPublication,
  unhideSifaPublication,
  unhideStandardPublication,
} from './publications.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('ORCID publication hide/unhide', () => {
  it('hideOrcidPublication POSTs to /api/profile/orcid-publications/<putCode>/hide', async () => {
    const fetchImpl = jsonFetch({});
    await hideOrcidPublication({ ...baseConfig, fetch: fetchImpl }, 42);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/orcid-publications/42/hide');
    expect(init.method).toBe('POST');
  });

  it('unhideOrcidPublication DELETEs the same path', async () => {
    const fetchImpl = jsonFetch({});
    await unhideOrcidPublication({ ...baseConfig, fetch: fetchImpl }, 42);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/orcid-publications/42/hide');
    expect(init.method).toBe('DELETE');
  });
});

describe('standard publication hide/unhide', () => {
  it('hideStandardPublication URL-encodes the AT URI', async () => {
    const fetchImpl = jsonFetch({});
    await hideStandardPublication(
      { ...baseConfig, fetch: fetchImpl },
      'at://did:plc:x/app.bsky.feed.post/abc',
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe(
      'https://api.example/api/profile/standard-publications/at%3A%2F%2Fdid%3Aplc%3Ax%2Fapp.bsky.feed.post%2Fabc/hide',
    );
    expect(init.method).toBe('POST');
  });

  it('unhideStandardPublication uses DELETE', async () => {
    const fetchImpl = jsonFetch({});
    await unhideStandardPublication(
      { ...baseConfig, fetch: fetchImpl },
      'at://did:plc:x/app.bsky.feed.post/abc',
    );
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });
});

describe('bulk hide/unhide standard publications', () => {
  it('bulkHideStandardPublications POSTs { uris } to /bulk-hide', async () => {
    const fetchImpl = jsonFetch({});
    const uris = ['at://a', 'at://b'];
    await bulkHideStandardPublications({ ...baseConfig, fetch: fetchImpl }, uris);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/standard-publications/bulk-hide');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ uris });
  });

  it('bulkUnhideStandardPublications DELETEs the same path with { uris }', async () => {
    const fetchImpl = jsonFetch({});
    await bulkUnhideStandardPublications({ ...baseConfig, fetch: fetchImpl }, ['at://a']);
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ uris: ['at://a'] });
  });
});

describe('Sifa publication hide/unhide', () => {
  it('hideSifaPublication POSTs to /api/profile/publications/<rkey>/hide', async () => {
    const fetchImpl = jsonFetch({});
    await hideSifaPublication({ ...baseConfig, fetch: fetchImpl }, 'pub1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/publications/pub1/hide');
    expect(init.method).toBe('POST');
  });

  it('unhideSifaPublication DELETEs the same path', async () => {
    const fetchImpl = jsonFetch({});
    await unhideSifaPublication({ ...baseConfig, fetch: fetchImpl }, 'pub1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });
});

describe('refreshOrcidPublications', () => {
  it('returns { success: true, added, removed } on success', async () => {
    const fetchImpl = jsonFetch({ added: 3, removed: 1 });
    const result = await refreshOrcidPublications({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ success: true, added: 3, removed: 1 });
  });

  it('folds inline { error } responses into { success: false, error }', async () => {
    const fetchImpl = jsonFetch({ error: 'quota_exceeded' });
    const result = await refreshOrcidPublications({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ success: false, error: 'quota_exceeded' });
  });

  it('returns { success: false, error } on HTTP failure', async () => {
    const fetchImpl = jsonFetch({ message: 'Unauthorized' }, 401);
    const result = await refreshOrcidPublications({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('POSTs an empty body to /api/profile/orcid-publications/refresh', async () => {
    const fetchImpl = jsonFetch({ added: 0, removed: 0 });
    await refreshOrcidPublications({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/orcid-publications/refresh');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{}');
  });
});
