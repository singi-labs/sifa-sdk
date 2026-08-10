import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { fetchReceivedEndorsements } from './received-endorsements.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function url(fetchImpl: typeof fetch): string {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[0]![0];
}

const ITEM = {
  endorserDid: 'did:plc:pedro',
  endorserHandle: 'kacaii.dev',
  endorserDisplayName: 'Pedro Ayres',
  endorserAvatar: 'https://cdn.example/pedro.jpg',
  skillName: 'Gleam',
  createdAt: '2026-08-08T21:30:50.270Z',
};

describe('fetchReceivedEndorsements', () => {
  it('reads the endorsements for a DID', async () => {
    const fetchImpl = jsonFetch({ endorsements: [ITEM] });
    const page = await fetchReceivedEndorsements(
      { ...baseConfig, fetch: fetchImpl },
      'did:plc:giacomo',
    );
    expect(page.endorsements[0]?.skillName).toBe('Gleam');
    expect(url(fetchImpl)).toBe('https://api.example/api/endorsement/did%3Aplc%3Agiacomo');
  });

  it('passes a limit through', async () => {
    const fetchImpl = jsonFetch({ endorsements: [] });
    await fetchReceivedEndorsements({ ...baseConfig, fetch: fetchImpl }, 'did:plc:x', { limit: 3 });
    expect(url(fetchImpl)).toContain('?limit=3');
  });

  it('returns an empty page on failure rather than throwing', async () => {
    // This decorates a page; it must not be able to break one.
    const fetchImpl = jsonFetch({ error: 'Boom' }, 500);
    const page = await fetchReceivedEndorsements({ ...baseConfig, fetch: fetchImpl }, 'did:plc:x');
    expect(page).toEqual({ endorsements: [] });
  });

  it('tolerates an endorser with no handle or avatar', async () => {
    // The endorser need not be a Sifa user.
    const fetchImpl = jsonFetch({
      endorsements: [{ endorserDid: 'did:plc:x', skillName: 'Rust', createdAt: ITEM.createdAt }],
    });
    const page = await fetchReceivedEndorsements({ ...baseConfig, fetch: fetchImpl }, 'did:plc:y');
    expect(page.endorsements[0]?.endorserHandle).toBeUndefined();
    expect(page.endorsements[0]?.endorserAvatar).toBeUndefined();
  });
});
