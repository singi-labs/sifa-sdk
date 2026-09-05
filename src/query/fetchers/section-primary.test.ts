import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { setSectionPrimary, unsetSectionPrimary, type PrimarySection } from './section-primary.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const sections: PrimarySection[] = [
  'education',
  'publication',
  'presentation',
  'involvement',
  'project',
];

describe('section primary toggle', () => {
  for (const section of sections) {
    it(`setSectionPrimary PUTs /api/profile/${section}/<rkey>/primary`, async () => {
      const fetchImpl = jsonFetch({});
      await setSectionPrimary({ ...baseConfig, fetch: fetchImpl }, section, 'r1');
      const [url, init] = getCall(fetchImpl);
      expect(url).toBe(`https://api.example/api/profile/${section}/r1/primary`);
      expect(init.method).toBe('PUT');
    });

    it(`unsetSectionPrimary DELETEs /api/profile/${section}/<rkey>/primary`, async () => {
      const fetchImpl = jsonFetch({});
      await unsetSectionPrimary({ ...baseConfig, fetch: fetchImpl }, section, 'r1');
      const [url, init] = getCall(fetchImpl);
      expect(url).toBe(`https://api.example/api/profile/${section}/r1/primary`);
      expect(init.method).toBe('DELETE');
    });
  }

  it('encodes the rkey', async () => {
    const fetchImpl = jsonFetch({});
    await setSectionPrimary({ ...baseConfig, fetch: fetchImpl }, 'education', 'a/b');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/education/a%2Fb/primary');
  });
});
