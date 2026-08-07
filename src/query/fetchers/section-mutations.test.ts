import { describe, expect, it, vi } from 'vitest';

import type { ProfilePosition, SkillRef } from '../../types/index.js';
import { type SifaApiConfig } from '../client.js';
import { createEducation, deleteEducation, updateEducation } from './education.js';
import {
  deletePosition,
  linkSkillToPosition,
  setPositionPrimary,
  unlinkSkillFromPosition,
  unsetPositionPrimary,
  updatePosition,
} from './positions.js';
import { createInvestment, updateInvestment, deleteInvestment } from './investments.js';
import { createRecord, deleteRecord, updateRecord } from './records.js';
import { createSkill, deleteSkill, updateSkill } from './skills.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('positions: update/delete/primary toggle', () => {
  it('updatePosition PUTs the body to /api/profile/position/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updatePosition({ ...baseConfig, fetch: fetchImpl }, 'r1', { title: 'CTO' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position/r1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ title: 'CTO' });
  });

  it('deletePosition DELETEs /api/profile/position/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await deletePosition({ ...baseConfig, fetch: fetchImpl }, 'r1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position/r1');
    expect(init.method).toBe('DELETE');
  });

  it('setPositionPrimary PUTs /api/profile/position/<rkey>/primary', async () => {
    const fetchImpl = jsonFetch({});
    await setPositionPrimary({ ...baseConfig, fetch: fetchImpl }, 'r1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position/r1/primary');
    expect(init.method).toBe('PUT');
  });

  it('unsetPositionPrimary DELETEs /api/profile/position/<rkey>/primary', async () => {
    const fetchImpl = jsonFetch({});
    await unsetPositionPrimary({ ...baseConfig, fetch: fetchImpl }, 'r1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });

  it('returns { success: false, error } on HTTP failure (never throws)', async () => {
    const fetchImpl = jsonFetch({ message: 'Forbidden' }, 403);
    const result = await deletePosition({ ...baseConfig, fetch: fetchImpl }, 'r1');
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });
});

describe('positions: skill linking', () => {
  const basePosition: ProfilePosition = {
    rkey: 'r1',
    company: 'Sifa',
    title: 'Founder',
    description: 'Building Sifa.',
    startedAt: '2026-01-01T00:00:00Z',
    skills: [{ uri: 'at://did:plc:x/id.sifa.profile.skill/existing' }],
  };

  it('linkSkillToPosition is idempotent (no fetch when skill already linked)', async () => {
    const fetchImpl = vi.fn();
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/existing' };
    const result = await linkSkillToPosition(
      { ...baseConfig, fetch: fetchImpl },
      basePosition,
      skill,
    );
    expect(result).toEqual({ success: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('linkSkillToPosition PUTs with the new skill appended', async () => {
    const fetchImpl = jsonFetch({});
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/new' };
    await linkSkillToPosition({ ...baseConfig, fetch: fetchImpl }, basePosition, skill);
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/position/r1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body as string) as { skills: SkillRef[] };
    expect(body.skills.map((s) => s.uri)).toEqual([
      'at://did:plc:x/id.sifa.profile.skill/existing',
      'at://did:plc:x/id.sifa.profile.skill/new',
    ]);
  });

  it('unlinkSkillFromPosition PUTs without the removed skill', async () => {
    const fetchImpl = jsonFetch({});
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/existing' };
    await unlinkSkillFromPosition({ ...baseConfig, fetch: fetchImpl }, basePosition, skill);
    const [, init] = getCall(fetchImpl);
    const body = JSON.parse(init.body as string) as { skills: SkillRef[] };
    expect(body.skills).toEqual([]);
  });

  it('linkSkillToPosition strips a null location (so JSON.stringify drops it)', async () => {
    const fetchImpl = jsonFetch({});
    const position: ProfilePosition = { ...basePosition, location: null };
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/new' };
    await linkSkillToPosition({ ...baseConfig, fetch: fetchImpl }, position, skill);
    const [, init] = getCall(fetchImpl);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.location).toBeUndefined();
  });

  it('linkSkillToPosition preserves employmentType, workplaceType, and entityRef', async () => {
    const fetchImpl = jsonFetch({});
    const position: ProfilePosition = {
      ...basePosition,
      employmentType: 'id.sifa.defs#fullTime',
      workplaceType: 'id.sifa.defs#remote',
      entityRef: 'http://www.wikidata.org/entity/Q42',
    };
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/new' };
    await linkSkillToPosition({ ...baseConfig, fetch: fetchImpl }, position, skill);
    const [, init] = getCall(fetchImpl);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.employmentType).toBe('id.sifa.defs#fullTime');
    expect(body.workplaceType).toBe('id.sifa.defs#remote');
    expect(body.entityRef).toBe('http://www.wikidata.org/entity/Q42');
  });

  it('unlinkSkillFromPosition preserves employmentType, workplaceType, and entityRef', async () => {
    const fetchImpl = jsonFetch({});
    const position: ProfilePosition = {
      ...basePosition,
      employmentType: 'id.sifa.defs#fullTime',
      workplaceType: 'id.sifa.defs#remote',
      entityRef: 'http://www.wikidata.org/entity/Q42',
    };
    const skill: SkillRef = { uri: 'at://did:plc:x/id.sifa.profile.skill/existing' };
    await unlinkSkillFromPosition({ ...baseConfig, fetch: fetchImpl }, position, skill);
    const [, init] = getCall(fetchImpl);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.employmentType).toBe('id.sifa.defs#fullTime');
    expect(body.workplaceType).toBe('id.sifa.defs#remote');
    expect(body.entityRef).toBe('http://www.wikidata.org/entity/Q42');
  });
});

describe('education mutations', () => {
  it('createEducation POSTs to /api/profile/education and returns rkey', async () => {
    const fetchImpl = jsonFetch({ rkey: 'e1' });
    const result = await createEducation({ ...baseConfig, fetch: fetchImpl }, { school: 'X' });
    expect(result).toEqual({ success: true, rkey: 'e1' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/education');
    expect(init.method).toBe('POST');
  });

  it('updateEducation PUTs to /api/profile/education/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updateEducation({ ...baseConfig, fetch: fetchImpl }, 'e1', { school: 'Y' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/education/e1');
    expect(init.method).toBe('PUT');
  });

  it('deleteEducation DELETEs /api/profile/education/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await deleteEducation({ ...baseConfig, fetch: fetchImpl }, 'e1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/education/e1');
    expect(init.method).toBe('DELETE');
  });
});

describe('skill mutations', () => {
  it('createSkill POSTs to /api/profile/skill', async () => {
    const fetchImpl = jsonFetch({ rkey: 's1' });
    const result = await createSkill({ ...baseConfig, fetch: fetchImpl }, { name: 'TypeScript' });
    expect(result).toEqual({ success: true, rkey: 's1' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/skill');
    expect(init.method).toBe('POST');
  });

  it('updateSkill PUTs to /api/profile/skill/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updateSkill({ ...baseConfig, fetch: fetchImpl }, 's1', { name: 'Rust' });
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('PUT');
  });

  it('deleteSkill DELETEs /api/profile/skill/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await deleteSkill({ ...baseConfig, fetch: fetchImpl }, 's1');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/skill/s1');
  });
});

describe('generic record CRUD escape hatch', () => {
  it('createRecord POSTs to /api/profile/records/<collection>', async () => {
    const fetchImpl = jsonFetch({ rkey: 'c1' });
    const result = await createRecord(
      { ...baseConfig, fetch: fetchImpl },
      'id.sifa.profile.certification',
      { title: 'AWS' },
    );
    expect(result).toEqual({ success: true, rkey: 'c1' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.profile.certification');
  });

  it('updateRecord PUTs to /api/profile/records/<collection>/<rkey>', async () => {
    const fetchImpl = jsonFetch({});
    await updateRecord({ ...baseConfig, fetch: fetchImpl }, 'id.sifa.profile.certification', 'c1', {
      title: 'GCP',
    });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.profile.certification/c1');
    expect(init.method).toBe('PUT');
  });

  it('deleteRecord DELETEs the record path', async () => {
    const fetchImpl = jsonFetch({});
    await deleteRecord({ ...baseConfig, fetch: fetchImpl }, 'id.sifa.profile.certification', 'c1');
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('DELETE');
  });

  it('URL-encodes the collection NSID and rkey', async () => {
    const fetchImpl = jsonFetch({});
    await updateRecord({ ...baseConfig, fetch: fetchImpl }, 'id.sifa.x/y', 'r/k', {});
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.x%2Fy/r%2Fk');
  });

  it('preserves pdsHost from PDS-side failures', async () => {
    const fetchImpl = jsonFetch({ message: 'PDS down', pdsHost: 'eurosky.social' }, 503);
    const result = await createRecord(
      { ...baseConfig, fetch: fetchImpl },
      'id.sifa.profile.project',
      {},
    );
    expect(result).toEqual({
      success: false,
      error: 'PDS down',
      pdsHost: 'eurosky.social',
    });
  });
});

// sifa-api has no /api/profile/investment handler -- every collection without a
// bespoke route is served by /api/profile/records/<collection>. Asserting the URL
// rather than only the return shape is what catches a wrong path: a mocked fetch
// happily resolves whatever you point it at.
describe('investment fetchers hit the generic record route', () => {
  it('createInvestment POSTs to /api/profile/records/id.sifa.profile.investment', async () => {
    const fetchImpl = jsonFetch({ rkey: 'i1' });
    const result = await createInvestment(
      { ...baseConfig, fetch: fetchImpl },
      {
        company: 'ShopAgentic',
      },
    );
    expect(result).toEqual({ success: true, rkey: 'i1' });
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.profile.investment');
  });

  it('updateInvestment PUTs to the record route with the rkey', async () => {
    const fetchImpl = jsonFetch({});
    await updateInvestment({ ...baseConfig, fetch: fetchImpl }, 'i1', { company: 'X' });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.profile.investment/i1');
    expect(init.method).toBe('PUT');
  });

  it('deleteInvestment DELETEs the record route with the rkey', async () => {
    const fetchImpl = jsonFetch({});
    await deleteInvestment({ ...baseConfig, fetch: fetchImpl }, 'i1');
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/records/id.sifa.profile.investment/i1');
    expect(init.method).toBe('DELETE');
  });
});
