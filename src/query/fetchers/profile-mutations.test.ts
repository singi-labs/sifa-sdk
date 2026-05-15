import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { createPosition } from './positions.js';
import {
  deleteAvatarOverride,
  refreshPds,
  updateProfileOverride,
  updateProfileSelf,
  uploadAvatar,
} from './profile-mutations.js';
import { searchSkills } from './search.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function emptyFetch(status = 200, headers: HeadersInit = {}): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(null, { status, headers })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('createPosition (fixed endpoint + WriteResult shape)', () => {
  it('hits /api/profile/position (not /api/positions)', async () => {
    const fetchImpl = jsonFetch({ rkey: 'r1' });
    await createPosition({ ...baseConfig, fetch: fetchImpl }, { title: 'Dev', company: 'X' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position');
  });

  it('returns { success: true, rkey } on success', async () => {
    const fetchImpl = jsonFetch({ rkey: 'r1' });
    const result = await createPosition({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result).toEqual({ success: true, rkey: 'r1' });
  });

  it('returns { success: false, error } on HTTP error (never throws)', async () => {
    const fetchImpl = jsonFetch({ message: 'Bad request' }, 400);
    const result = await createPosition({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Bad request');
  });

  it('preserves pdsHost when the server reports a PDS-side failure', async () => {
    const fetchImpl = jsonFetch({ message: 'PDS unreachable', pdsHost: 'eurosky.social' }, 503);
    const result = await createPosition({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result.success).toBe(false);
    expect(result.pdsHost).toBe('eurosky.social');
  });

  it('falls back to "Request failed (status)" when the server omits a message', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await createPosition({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result.error).toBe('Request failed (500)');
  });
});

describe('updateProfileSelf', () => {
  it('PUTs to /api/profile/self with the body', async () => {
    const fetchImpl = jsonFetch({});
    await updateProfileSelf(
      { ...baseConfig, fetch: fetchImpl },
      { headline: 'Builder', about: 'About me' },
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/self');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ headline: 'Builder', about: 'About me' });
  });

  it('returns { success: false, error } on HTTP failure', async () => {
    const fetchImpl = jsonFetch({ message: 'Unauthorized' }, 401);
    const result = await updateProfileSelf({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns { success: false, error: "Network error" } when fetch throws', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch;
    const result = await updateProfileSelf({ ...baseConfig, fetch: fetchImpl }, {});
    expect(result).toEqual({ success: false, error: 'Network error' });
  });
});

describe('updateProfileOverride', () => {
  it('PUTs to /api/profile/override', async () => {
    const fetchImpl = jsonFetch({});
    await updateProfileOverride(
      { ...baseConfig, fetch: fetchImpl },
      { displayName: 'Alice', pronouns: 'she/her' },
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/override');
    expect(init.method).toBe('PUT');
  });

  it('serializes null fields (used to clear overrides)', async () => {
    const fetchImpl = jsonFetch({});
    await updateProfileOverride(
      { ...baseConfig, fetch: fetchImpl },
      { displayName: null, pronouns: null },
    );
    const [, init] = getCall(fetchImpl);
    expect(JSON.parse(init.body as string)).toEqual({ displayName: null, pronouns: null });
  });
});

describe('refreshPds', () => {
  it('returns { success: true, displayName, avatar } on success', async () => {
    const fetchImpl = jsonFetch({
      ok: true,
      displayName: 'Alice',
      avatar: 'https://cdn/x.png',
    });
    const result = await refreshPds({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({
      success: true,
      ok: true,
      displayName: 'Alice',
      avatar: 'https://cdn/x.png',
    });
  });

  it('POSTs to /api/profile/refresh-pds with no body', async () => {
    const fetchImpl = jsonFetch({ ok: true });
    await refreshPds({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/refresh-pds');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });
});

describe('uploadAvatar', () => {
  it('returns { success: true, url } on success', async () => {
    const fetchImpl = jsonFetch({ url: 'https://cdn/a.png' });
    const file = new Blob(['x'], { type: 'image/png' });
    const result = await uploadAvatar({ ...baseConfig, fetch: fetchImpl }, file);
    expect(result).toEqual({ success: true, url: 'https://cdn/a.png' });
  });

  it('POSTs FormData with field "file"', async () => {
    const fetchImpl = jsonFetch({ url: 'https://cdn/a.png' });
    const file = new Blob(['hello'], { type: 'image/png' });
    await uploadAvatar({ ...baseConfig, fetch: fetchImpl }, file);
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBeInstanceOf(Blob);
  });

  it('returns structured error including pdsHost when server fails', async () => {
    const fetchImpl = jsonFetch({ message: 'Upload rejected', pdsHost: 'eurosky.social' }, 413);
    const file = new Blob(['x'], { type: 'image/png' });
    const result = await uploadAvatar({ ...baseConfig, fetch: fetchImpl }, file);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Upload rejected');
    expect(result.pdsHost).toBe('eurosky.social');
  });

  it('falls back to "Request failed (status)" when error body omits a message', async () => {
    const fetchImpl = emptyFetch(500);
    const file = new Blob(['x'], { type: 'image/png' });
    const result = await uploadAvatar({ ...baseConfig, fetch: fetchImpl }, file);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request failed (500)');
  });
});

describe('deleteAvatarOverride', () => {
  it('DELETEs /api/profile/avatar', async () => {
    const fetchImpl = jsonFetch({});
    await deleteAvatarOverride({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/avatar');
    expect(init.method).toBe('DELETE');
  });
});

describe('searchSkills (canonical-skill search)', () => {
  it('returns [] for empty input without hitting the network', async () => {
    const fetchImpl = vi.fn();
    const result = await searchSkills({ ...baseConfig, fetch: fetchImpl }, '   ');
    expect(result).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the skills array from the response', async () => {
    const skills = [{ canonicalName: 'TypeScript', slug: 'typescript', category: 'technical' }];
    const fetchImpl = jsonFetch({ skills });
    const result = await searchSkills({ ...baseConfig, fetch: fetchImpl }, 'type', 5);
    expect(result).toEqual(skills);
  });

  it('builds the canonical-skills path (distinct from /api/search/skills)', async () => {
    const fetchImpl = jsonFetch({ skills: [] });
    await searchSkills({ ...baseConfig, fetch: fetchImpl }, 'react', 5);
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/skills/search?q=react&limit=5');
  });

  it('returns [] on error', async () => {
    const fetchImpl = jsonFetch({}, 500);
    const result = await searchSkills({ ...baseConfig, fetch: fetchImpl }, 'react');
    expect(result).toEqual([]);
  });
});
