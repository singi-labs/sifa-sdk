import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchSpeakers, fetchTalks } from './speakers.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSpeakers', () => {
  it('hits /api/speakers with no query when no filters are provided', async () => {
    const fetchImpl = jsonFetch({ speakers: [] });
    const result = await fetchSpeakers({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ speakers: [] });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/speakers');
  });

  it('builds the query string for topic + limit', async () => {
    const fetchImpl = jsonFetch({ speakers: [] });
    await fetchSpeakers({ ...baseConfig, fetch: fetchImpl }, { topic: 'Magento', limit: 10 });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('/api/speakers?');
    expect(url).toContain('topic=Magento');
    expect(url).toContain('limit=10');
  });

  it('URL-encodes special characters in the topic', async () => {
    const fetchImpl = jsonFetch({ speakers: [] });
    await fetchSpeakers({ ...baseConfig, fetch: fetchImpl }, { topic: 'C++ & AI' });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('topic=C%2B%2B+%26+AI');
  });

  it('trims a whitespace-only topic to no param', async () => {
    const fetchImpl = jsonFetch({ speakers: [] });
    await fetchSpeakers({ ...baseConfig, fetch: fetchImpl }, { topic: '   ' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/speakers');
  });

  it('returns the parsed speakers payload', async () => {
    const speakers = [
      {
        did: 'did:plc:abc',
        handle: 'alice.example',
        displayName: 'Alice',
        avatar: null,
        headline: 'Builder',
        currentRole: 'Staff Engineer',
        currentCompany: 'Acme',
        deliveryCount: 3,
        group: 'spoke_about_it',
        matchedTopics: ['Magento'],
        recentEvents: ['MageTitans 2025'],
        eventsSelfReported: true,
        recentTalks: [
          { title: 'Scaling Magento checkout', rkey: '3abc' },
          { title: 'Adobe Commerce performance', rkey: '3def' },
        ],
      },
    ];
    const fetchImpl = jsonFetch({ speakers });
    const result = await fetchSpeakers({ ...baseConfig, fetch: fetchImpl }, { topic: 'Magento' });
    expect(result.speakers).toEqual(speakers);
    // recentTalks surfaces through the fetcher with the { title, rkey } shape.
    expect(result.speakers[0]!.recentTalks).toEqual([
      { title: 'Scaling Magento checkout', rkey: '3abc' },
      { title: 'Adobe Commerce performance', rkey: '3def' },
    ]);
  });

  it('returns an empty list on error', async () => {
    const fetchImpl = jsonFetch({ error: 'Boom' }, 500);
    const result = await fetchSpeakers({ ...baseConfig, fetch: fetchImpl }, { topic: 'x' });
    expect(result).toEqual({ speakers: [] });
  });
});

describe('fetchTalks', () => {
  it('hits /api/talks with no query when no filters are provided', async () => {
    const fetchImpl = jsonFetch({ talks: [] });
    const result = await fetchTalks({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ talks: [] });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/talks');
  });

  it('builds the query string for topic + limit', async () => {
    const fetchImpl = jsonFetch({ talks: [] });
    await fetchTalks({ ...baseConfig, fetch: fetchImpl }, { topic: 'GraphQL', limit: 5 });
    const [url] = getCall(fetchImpl);
    expect(url).toContain('/api/talks?');
    expect(url).toContain('topic=GraphQL');
    expect(url).toContain('limit=5');
  });

  it('returns the parsed talks payload', async () => {
    const talks = [
      {
        kind: 'presentation',
        rkey: '3l',
        title: 'Scaling GraphQL',
        snippet: 'A talk about scaling.',
        links: [{ uri: 'https://slides.example', label: 'Slides', type: 'slides' }],
        writeupUri: null,
        speaker: {
          did: 'did:plc:abc',
          handle: 'alice.example',
          displayName: 'Alice',
          avatar: null,
          headline: 'Builder',
          currentRole: 'Staff Engineer',
          currentCompany: 'Acme',
        },
        events: [{ eventName: 'GraphQL Summit', date: '2025-05-01' }],
        eventsSelfReported: true,
        deliveryCount: 2,
        matchedTopics: ['GraphQL'],
      },
    ];
    const fetchImpl = jsonFetch({ talks });
    const result = await fetchTalks({ ...baseConfig, fetch: fetchImpl }, { topic: 'GraphQL' });
    expect(result.talks).toEqual(talks);
  });

  it('returns an empty list on error', async () => {
    const fetchImpl = jsonFetch({ error: 'Boom' }, 500);
    const result = await fetchTalks({ ...baseConfig, fetch: fetchImpl }, { topic: 'x' });
    expect(result).toEqual({ talks: [] });
  });
});
