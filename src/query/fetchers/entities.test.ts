import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchEntitySearch,
  selectEntity,
  importSearchEntities,
  resolveEntityDomain,
  mintEntityDomain,
} from './entities.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example' };

afterEach(() => vi.restoreAllMocks());

describe('fetchEntitySearch', () => {
  it('returns empty without a network call for a blank query', async () => {
    const fetchImpl = jsonFetch({});
    const res = await fetchEntitySearch({ ...config, fetch: fetchImpl }, '   ');
    expect(res).toEqual({ results: [], hasMore: false });
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(0);
  });

  it('GETs the search endpoint with q + limit and parses the response', async () => {
    const fetchImpl = jsonFetch({
      results: [
        {
          source: 'entity',
          entityId: 1,
          kind: 'org',
          name: 'Spryker',
          domain: 'spryker.com',
          country: 'DE',
          logoUrl: null,
          parentName: null,
        },
      ],
      hasMore: false,
    });
    const res = await fetchEntitySearch({ ...config, fetch: fetchImpl }, 'Spryker', 5);
    expect(res.results[0]?.name).toBe('Spryker');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/entities/search?q=Spryker&limit=5');
  });
});

describe('selectEntity', () => {
  it('POSTs the selection and parses the response', async () => {
    const fetchImpl = jsonFetch({
      entityId: 3,
      slug: 'acme',
      kind: 'org',
      canonicalName: 'Acme',
      domain: 'acme.com',
      entityRef: 'http://www.wikidata.org/entity/Q42',
    });
    const res = await selectEntity({ ...config, fetch: fetchImpl }, { pdlId: 'abc' });
    expect(res.entityRef).toBe('http://www.wikidata.org/entity/Q42');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/entities/select');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ pdlId: 'abc' });
  });
});

describe('importSearchEntities', () => {
  it('POSTs the query and returns the results array', async () => {
    const fetchImpl = jsonFetch({
      results: [
        {
          source: 'entity',
          entityId: 9,
          kind: 'org',
          name: 'Imported',
          domain: null,
          country: null,
          logoUrl: null,
          parentName: null,
        },
      ],
    });
    const res = await importSearchEntities({ ...config, fetch: fetchImpl }, 'Imported');
    expect(res).toHaveLength(1);
    expect(res[0]?.name).toBe('Imported');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/entities/import-search');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ q: 'Imported' });
  });

  it('returns empty without a network call for a blank query', async () => {
    const fetchImpl = jsonFetch({});
    const res = await importSearchEntities({ ...config, fetch: fetchImpl }, '');
    expect(res).toEqual([]);
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(0);
  });
});

describe('resolveEntityDomain', () => {
  it('POSTs the domain and parses results + canMint', async () => {
    const fetchImpl = jsonFetch({
      results: [
        {
          source: 'entity',
          entityId: 42,
          kind: 'org',
          name: 'Randstad',
          domain: null,
          country: 'NL',
          logoUrl: null,
          parentName: null,
        },
      ],
      canMint: false,
    });
    const res = await resolveEntityDomain({ ...config, fetch: fetchImpl }, 'randstad.com');
    expect(res.results[0]?.name).toBe('Randstad');
    expect(res.canMint).toBe(false);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/entities/resolve-domain');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ domain: 'randstad.com' });
  });

  it('parses an empty result with canMint true (offer the mint affordance)', async () => {
    const fetchImpl = jsonFetch({ results: [], canMint: true });
    const res = await resolveEntityDomain({ ...config, fetch: fetchImpl }, 'cxl.com');
    expect(res.results).toEqual([]);
    expect(res.canMint).toBe(true);
  });
});

describe('mintEntityDomain', () => {
  it('POSTs the domain and parses the minted result', async () => {
    const fetchImpl = jsonFetch({
      result: {
        source: 'entity',
        entityId: 77,
        kind: 'org',
        name: 'CXL',
        domain: 'cxl.com',
        country: null,
        logoUrl: 'https://cxl.com/logo.png',
        parentName: null,
      },
    });
    const res = await mintEntityDomain({ ...config, fetch: fetchImpl }, 'cxl.com');
    expect(res.result.name).toBe('CXL');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/entities/mint-domain');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ domain: 'cxl.com' });
  });
});
