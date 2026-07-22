import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchProfileSummary } from './profile-summary.js';
import { type SifaApiConfig } from '../client.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const config: SifaApiConfig = { baseUrl: 'https://api.example' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchProfileSummary', () => {
  it('reads getProfileView and returns the compact summary', async () => {
    const fetchImpl = jsonFetch({
      did: 'did:plc:abc',
      handle: 'alice.example',
      displayName: 'Alice',
      headline: 'Builder',
      positions: [{ rkey: '1', title: 'Staff Engineer', company: 'Acme', startedAt: '2021-01' }],
      skills: [{ rkey: 's', name: 'TypeScript' }],
      claimed: true,
    });

    const summary = await fetchProfileSummary({ ...config, fetch: fetchImpl }, 'alice.example');

    expect(summary).toEqual({
      did: 'did:plc:abc',
      handle: 'alice.example',
      displayName: 'Alice',
      avatar: undefined,
      pronouns: undefined,
      headline: 'Builder',
      currentTitle: 'Staff Engineer',
      currentCompany: 'Acme',
      topSkills: ['TypeScript'],
      claimed: true,
    });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/xrpc/id.sifa.getProfileView?actor=alice.example');
  });

  it('returns null when the AppView has no profile (ProfileNotFound)', async () => {
    const fetchImpl = jsonFetch({ error: 'ProfileNotFound' }, 400);
    const summary = await fetchProfileSummary({ ...config, fetch: fetchImpl }, 'nobody.invalid');
    expect(summary).toBeNull();
  });

  it('forwards maxSkills to the summarizer without leaking it into the request', async () => {
    const fetchImpl = jsonFetch({
      did: 'did:plc:abc',
      handle: 'alice.example',
      skills: [
        { rkey: '0', name: 'a' },
        { rkey: '1', name: 'b' },
        { rkey: '2', name: 'c' },
      ],
    });

    const summary = await fetchProfileSummary({ ...config, fetch: fetchImpl }, 'alice.example', {
      maxSkills: 2,
    });

    expect(summary?.topSkills).toEqual(['a', 'b']);
    const [url] = getCall(fetchImpl);
    expect(url).not.toContain('maxSkills');
  });
});
