import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchSearchCompanies,
  fetchSearchCompanyFilters,
  type CompanySearchResponse,
} from './search.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example' };

const RESPONSE: CompanySearchResponse = {
  results: [
    {
      publicId: 'abc123',
      name: 'Sophos',
      domain: 'sophos.com',
      country: 'GB',
      industry: 'computer security software',
      logoUrl: null,
      employeeCount: null,
    },
  ],
  hasMore: false,
};
const RESPONSE_EMPTY: CompanySearchResponse = { results: [], hasMore: false };

afterEach(() => vi.restoreAllMocks());

describe('fetchSearchCompanies (workspace#299)', () => {
  it('returns empty without a network call for a blank query and no country', async () => {
    // The API rejects a blank q with no country rather than scanning ~200k
    // rows, so asking would only spend a round trip to be told no.
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    for (const q of [undefined, '', '   ']) {
      const res = await fetchSearchCompanies(config, { q });
      expect(res).toEqual({ results: [], hasMore: false });
    }
    expect(await fetchSearchCompanies(config, { country: [] })).toEqual(RESPONSE_EMPTY);
    expect(f).not.toHaveBeenCalled();
  });

  it('lists organizations by country without a query (workspace#759)', async () => {
    const f = jsonFetch({ ...RESPONSE, total: 1 });
    vi.stubGlobal('fetch', f);
    const res = await fetchSearchCompanies(config, { country: ['DE', 'NL'], limit: 20 });
    const url = new URL(getCall(f)[0]);
    expect(url.pathname).toBe('/api/search/companies');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.getAll('country')).toEqual(['DE', 'NL']);
    expect(res.total).toBe(1);
  });

  it('lists a single country given as a string, with a blank query', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: '  ', country: 'DE' });
    const url = new URL(getCall(f)[0]);
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.getAll('country')).toEqual(['DE']);
  });

  it('passes the offset through for the country listing', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { country: 'DE', offset: 20 });
    expect(getCall(f)[0]).toContain('offset=20');
  });

  it('sends the query and both filters', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: 'sophos', country: 'GB', industry: 'security' });
    const [url] = getCall(f);
    expect(url).toContain('/api/search/companies?');
    expect(url).toContain('q=sophos');
    expect(url).toContain('country=GB');
    expect(url).toContain('industry=security');
  });

  it('sends several countries as repeated params (workspace#759)', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: 'sophos', country: ['DE', 'NL'] });
    const url = new URL(getCall(f)[0]);
    expect(url.searchParams.getAll('country')).toEqual(['DE', 'NL']);
  });

  it('trims the query rather than sending padding', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: '  sophos  ' });
    expect(getCall(f)[0]).toContain('q=sophos');
  });

  it('omits filters that were not set', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: 'sophos' });
    const [url] = getCall(f);
    expect(url).not.toContain('country=');
    expect(url).not.toContain('industry=');
    expect(url).not.toContain('limit=');
    expect(url).not.toContain('offset=');
  });

  it('passes the limit through', async () => {
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    await fetchSearchCompanies(config, { q: 'sophos', limit: 5 });
    expect(getCall(f)[0]).toContain('limit=5');
  });

  it('returns each result with its own domain', async () => {
    // The API shipped a version where every row carried the same domain; the
    // SDK is the layer consumers trust, so assert the value survives the trip.
    const f = jsonFetch({
      results: [
        { ...RESPONSE.results[0], publicId: 'a', name: 'Booking', domain: 'booking.com' },
        { ...RESPONSE.results[0], publicId: 'b', name: 'Bookis', domain: 'bookis.com' },
      ],
      hasMore: true,
    });
    vi.stubGlobal('fetch', f);
    const res = await fetchSearchCompanies(config, { q: 'book' });
    expect(res.results.map((r) => r.domain)).toEqual(['booking.com', 'bookis.com']);
    expect(res.hasMore).toBe(true);
  });
});

describe('fetchSearchCompanyFilters (workspace#759)', () => {
  it('reads the organization country counts', async () => {
    const body = { countries: [{ countryCode: 'NL', country: 'Netherlands', count: 12 }] };
    const f = jsonFetch(body);
    vi.stubGlobal('fetch', f);
    const res = await fetchSearchCompanyFilters(config);
    expect(getCall(f)[0]).toContain('/api/search/companies/filters');
    expect(res).toEqual(body);
  });

  it('returns no countries on error, so the filter degrades instead of failing', async () => {
    vi.stubGlobal('fetch', jsonFetch({}, 500));
    expect(await fetchSearchCompanyFilters(config)).toEqual({ countries: [] });
  });
});
