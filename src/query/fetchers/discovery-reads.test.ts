import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  fetchFeaturedProfile,
  fetchSimilarProfiles,
  fetchSuggestionCount,
  fetchSuggestions,
} from './discovery.js';
import { fetchFollowing } from './follow.js';
import { fetchSearchFilters, fetchSearchProfiles, fetchSkillSuggestions } from './search.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('fetchSearchProfiles', () => {
  it('returns empty result when no filters are provided (no network call)', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchSearchProfiles({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result).toEqual({ profiles: [], total: 0, limit: 20, offset: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('builds the correct query string for combined filters', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles(
      { ...baseConfig, fetch: fetchImpl },
      { q: 'engineer', country: 'NL', limit: 10 },
    );
    const [url] = getCall(fetchImpl);
    expect(url).toContain('/api/search/profiles?');
    expect(url).toContain('q=engineer');
    expect(url).toContain('country=NL');
    expect(url).toContain('limit=10');
  });

  it('URL-encodes special characters in the query', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles({ ...baseConfig, fetch: fetchImpl }, { q: 'C++ dev & ML' });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('q=C%2B%2B+dev+%26+ML');
  });

  it('appends a single openTo param when one token is provided', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles({ ...baseConfig, fetch: fetchImpl }, { openTo: ['fullTime'] });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('openTo=fullTime');
  });

  it('repeats the openTo param for each selected token', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles(
      { ...baseConfig, fetch: fetchImpl },
      { openTo: ['fullTime', 'mentor', 'collab'] },
    );
    const [url] = getCall(fetchImpl);
    const matches = url.match(/openTo=/g) ?? [];
    expect(matches).toHaveLength(3);
    expect(url).toContain('openTo=fullTime');
    expect(url).toContain('openTo=mentor');
    expect(url).toContain('openTo=collab');
  });

  it('skips the openTo param entirely when the array is empty', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles({ ...baseConfig, fetch: fetchImpl }, { q: 'engineer', openTo: [] });
    const [url] = getCall(fetchImpl);
    expect(url).not.toContain('openTo=');
  });

  it('skips empty / falsy tokens within openTo without emitting blank params', async () => {
    const fetchImpl = jsonFetch({ profiles: [], total: 0, limit: 20, offset: 0 });
    await fetchSearchProfiles(
      { ...baseConfig, fetch: fetchImpl },
      { openTo: ['fullTime', '', 'mentor'] },
    );
    const [url] = getCall(fetchImpl);
    const matches = url.match(/openTo=/g) ?? [];
    expect(matches).toHaveLength(2);
  });
});

describe('fetchSkillSuggestions', () => {
  it('returns [] for empty input without hitting the network', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchSkillSuggestions({ ...baseConfig, fetch: fetchImpl }, '   ');
    expect(result).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the response skills array', async () => {
    const fetchImpl = jsonFetch({
      skills: [{ name: 'TypeScript', slug: 'typescript', category: 'technical', userCount: 42 }],
    });
    const result = await fetchSkillSuggestions({ ...baseConfig, fetch: fetchImpl }, 'type');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('TypeScript');
  });
});

describe('fetchSearchFilters', () => {
  it('returns empty defaults on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchSearchFilters({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ countries: [], industries: [], apps: [], openTo: [] });
  });
});

describe('fetchSimilarProfiles', () => {
  it('returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchSimilarProfiles({ ...baseConfig, fetch: fetchImpl }, 'did:plc:x', {
      limit: 3,
    });
    expect(result).toEqual([]);
  });

  it('passes the limit param and DID-encodes the path', async () => {
    const fetchImpl = jsonFetch({ profiles: [] });
    await fetchSimilarProfiles({ ...baseConfig, fetch: fetchImpl }, 'did:plc:abc', { limit: 7 });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/discover/similar/did%3Aplc%3Aabc?limit=7');
  });
});

describe('fetchSuggestions', () => {
  it('forwards cookie header when provided (RSC pattern)', async () => {
    const fetchImpl = jsonFetch({ onSifa: [], notOnSifa: [] });
    await fetchSuggestions({ ...baseConfig, fetch: fetchImpl }, { cookieHeader: 'session=abc' });
    const [, init] = getCall(fetchImpl);
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });

  it('returns empty arrays on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchSuggestions({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ onSifa: [], notOnSifa: [] });
  });
});

describe('fetchSuggestionCount', () => {
  it('reads the count field', async () => {
    const fetchImpl = jsonFetch({ count: 12 });
    const result = await fetchSuggestionCount({ ...baseConfig, fetch: fetchImpl }, '2026-05-01');
    expect(result).toBe(12);
  });

  it('returns 0 on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchSuggestionCount({ ...baseConfig, fetch: fetchImpl });
    expect(result).toBe(0);
  });
});

describe('fetchFeaturedProfile', () => {
  it('returns null on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchFeaturedProfile({ ...baseConfig, fetch: fetchImpl });
    expect(result).toBeNull();
  });
});

describe('fetchFollowing', () => {
  it('returns empty follows on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await fetchFollowing({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ follows: [] });
  });

  it('builds query string from optional opts', async () => {
    const fetchImpl = jsonFetch({ follows: [] });
    await fetchFollowing({ ...baseConfig, fetch: fetchImpl }, { source: 'bluesky', limit: 25 });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('/api/following?');
    expect(url).toContain('source=bluesky');
    expect(url).toContain('limit=25');
  });
});
