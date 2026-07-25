import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { updateSkillSubCategories } from './skills.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  // The vi.fn() mock registry is not part of the `fetch` type, so reaching for
  // `.mock.calls` needs a cast; the shape is guaranteed by jsonFetch above.
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('updateSkillSubCategories (#324)', () => {
  it('POSTs every rkey in one request to the bulk endpoint', async () => {
    const fetchImpl = jsonFetch({ ok: true, updated: 3, unchanged: 0, skipped: [] });
    await updateSkillSubCategories(
      { ...baseConfig, fetch: fetchImpl },
      ['a', 'b', 'c'],
      'Frontend',
    );

    // Same cast as getCall, here only to count calls rather than read one.
    const calls = (fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls;
    expect(calls).toHaveLength(1);

    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/skills/subcategory');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      rkeys: ['a', 'b', 'c'],
      subCategory: 'Frontend',
    });
  });

  it('sends an empty label as-is so the server clears the field', async () => {
    const fetchImpl = jsonFetch({ ok: true, updated: 1, unchanged: 0, skipped: [] });
    await updateSkillSubCategories({ ...baseConfig, fetch: fetchImpl }, ['a'], '');

    const [, init] = getCall(fetchImpl);
    // JSON.parse returns `any`; the body shape is set by the fetcher under test.
    const body = JSON.parse(init.body as string) as { subCategory: string };
    expect(body.subCategory).toBe('');
  });

  it('returns the counts the server reports', async () => {
    const fetchImpl = jsonFetch({ ok: true, updated: 2, unchanged: 1, skipped: ['ghost'] });
    const result = await updateSkillSubCategories({ ...baseConfig, fetch: fetchImpl }, ['a'], 'X');

    expect(result.success).toBe(true);
    expect(result.updated).toBe(2);
    expect(result.unchanged).toBe(1);
    expect(result.skipped).toEqual(['ghost']);
  });

  it('surfaces a failure as a structured result rather than throwing', async () => {
    const fetchImpl = jsonFetch({ message: 'Rate limit exceeded' }, 429);
    const result = await updateSkillSubCategories({ ...baseConfig, fetch: fetchImpl }, ['a'], 'X');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
  });
});
