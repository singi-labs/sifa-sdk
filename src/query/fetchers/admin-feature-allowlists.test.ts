import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addFeatureAllowlist,
  listFeatureAllowlist,
  removeFeatureAllowlist,
} from './admin-feature-allowlists.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: undefined };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listFeatureAllowlist', () => {
  it('GETs the flag endpoint and returns items', async () => {
    const fetchImpl = jsonFetch({
      items: [{ did: 'did:plc:a', addedAt: '2026-06-01T10:00:00.000Z', note: 'beta' }],
    });
    const result = await listFeatureAllowlist({ ...config, fetch: fetchImpl }, 'FEED_V5_ENABLED');
    expect(result.items).toHaveLength(1);
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/admin/feature-allowlists/FEED_V5_ENABLED');
  });

  it('returns empty list on 403 (non-admin)', async () => {
    const fetchImpl = jsonFetch({ message: 'Forbidden' }, 403);
    const result = await listFeatureAllowlist({ ...config, fetch: fetchImpl }, 'FEED_V5_ENABLED');
    expect(result).toEqual({ items: [] });
  });
});

describe('addFeatureAllowlist', () => {
  it('POSTs the flag endpoint with did + optional note', async () => {
    const fetchImpl = jsonFetch({ status: 'ok' }, 201);
    const result = await addFeatureAllowlist(
      { ...config, fetch: fetchImpl },
      'FEED_V5_ENABLED',
      'did:plc:a',
      { note: 'beta tester' },
    );
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/admin/feature-allowlists/FEED_V5_ENABLED');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ did: 'did:plc:a', note: 'beta tester' }));
  });

  it('omits note from body when not provided', async () => {
    const fetchImpl = jsonFetch({ status: 'ok' }, 201);
    await addFeatureAllowlist({ ...config, fetch: fetchImpl }, 'FEED_V5_ENABLED', 'did:plc:a');
    const [, init] = getCall(fetchImpl);
    expect(init.body).toBe(JSON.stringify({ did: 'did:plc:a' }));
  });

  it('returns success: false with server message on 400', async () => {
    const fetchImpl = jsonFetch({ message: 'Invalid DID' }, 400);
    const result = await addFeatureAllowlist(
      { ...config, fetch: fetchImpl },
      'FEED_V5_ENABLED',
      'not-a-did',
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid DID');
  });
});

describe('removeFeatureAllowlist', () => {
  it('DELETEs /api/admin/feature-allowlists/:flag/:did', async () => {
    const fetchImpl = jsonFetch({ status: 'ok' });
    const result = await removeFeatureAllowlist(
      { ...config, fetch: fetchImpl },
      'FEED_V5_ENABLED',
      'did:plc:a',
    );
    expect(result.success).toBe(true);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe(
      'https://api.example/api/admin/feature-allowlists/FEED_V5_ENABLED/did%3Aplc%3Aa',
    );
    expect(init.method).toBe('DELETE');
  });
});
