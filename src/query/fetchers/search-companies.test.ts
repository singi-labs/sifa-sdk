import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSearchCompanies, type CompanySearchResponse } from './search.js';
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

afterEach(() => vi.restoreAllMocks());

describe('fetchSearchCompanies (workspace#299)', () => {
  it('returns empty without a network call for a blank query', async () => {
    // The API rejects a blank q rather than scanning ~200k rows, so asking
    // would only spend a round trip to be told no.
    const f = jsonFetch(RESPONSE);
    vi.stubGlobal('fetch', f);
    for (const q of [undefined, '', '   ']) {
      const res = await fetchSearchCompanies(config, { q });
      expect(res).toEqual({ results: [], hasMore: false });
    }
    expect(f).not.toHaveBeenCalled();
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
