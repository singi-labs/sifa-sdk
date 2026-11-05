import { describe, expect, it } from 'vitest';

import {
  ProfileEducationRecordSchema,
  ProfileInvolvementRecordSchema,
  ProfileProjectRecordSchema,
  ProfileSkillRecordSchema,
  toolRefSchema,
} from './index.js';

// sifa-lexicons 0.15.7: tool and skill links on profile records. A record
// schema that strips them loses the links on read, and the next save from the
// editor then writes the record back without them.
const createdAt = '2026-11-05T10:00:00.000Z';
const toolUri = 'at://did:plc:abc123/com.example.tool/3kabctool01';
const skillUri = 'at://did:plc:abc123/id.sifa.profile.skill/3kabcskill1';
const refs = (n: number, uri: string) => Array.from({ length: n }, () => ({ uri }));

describe('toolRefSchema', () => {
  it('requires an at-uri and carries no cid', () => {
    expect(toolRefSchema.safeParse({ uri: toolUri }).success).toBe(true);
    expect(toolRefSchema.safeParse({}).success).toBe(false);
    expect(toolRefSchema.safeParse({ uri: 'https://example.com/tool' }).success).toBe(false);
    expect(toolRefSchema.parse({ uri: toolUri, cid: 'bafy' })).toEqual({ uri: toolUri });
  });
});

describe.each([
  ['ProfileProjectRecordSchema', ProfileProjectRecordSchema, { name: 'Portal', createdAt }],
  [
    'ProfileEducationRecordSchema',
    ProfileEducationRecordSchema,
    { institution: 'Utrecht University', createdAt },
  ],
  [
    'ProfileInvolvementRecordSchema',
    ProfileInvolvementRecordSchema,
    { kind: 'id.sifa.defs#involvementOpenSource', createdAt },
  ],
  ['ProfileSkillRecordSchema', ProfileSkillRecordSchema, { name: 'Photo editing', createdAt }],
] as const)('%s tools', (_name, schema, base) => {
  it('keeps up to 50 tool refs and rejects 51 or a bad uri', () => {
    const parsed = schema.parse({ ...base, tools: refs(50, toolUri) }) as { tools?: unknown[] };
    expect(parsed.tools).toHaveLength(50);
    expect(schema.safeParse({ ...base, tools: refs(51, toolUri) }).success).toBe(false);
    expect(schema.safeParse({ ...base, tools: [{ uri: 'not a uri' }] }).success).toBe(false);
  });
});

describe.each([
  ['ProfileProjectRecordSchema', ProfileProjectRecordSchema, { name: 'Portal', createdAt }],
  [
    'ProfileEducationRecordSchema',
    ProfileEducationRecordSchema,
    { institution: 'Utrecht University', createdAt },
  ],
] as const)('%s skills', (_name, schema, base) => {
  it('keeps up to 50 skill refs and rejects 51 or a bad uri', () => {
    expect(schema.parse({ ...base, skills: refs(50, skillUri) }).skills).toHaveLength(50);
    expect(schema.safeParse({ ...base, skills: refs(51, skillUri) }).success).toBe(false);
    expect(schema.safeParse({ ...base, skills: [{ uri: 'not a uri' }] }).success).toBe(false);
  });
});

describe('ProfileSkillRecordSchema contexts', () => {
  const base = { name: 'Photo editing', createdAt };
  const professional = 'id.sifa.defs#contextProfessional';
  const personal = 'id.sifa.defs#contextPersonal';

  it('keeps up to two contexts, including unknown tokens', () => {
    expect(
      ProfileSkillRecordSchema.parse({ ...base, contexts: [professional, personal] }).contexts,
    ).toEqual([professional, personal]);
    const other = 'com.example.defs#contextOther';
    expect(ProfileSkillRecordSchema.parse({ ...base, contexts: [other] }).contexts).toEqual([
      other,
    ]);
  });

  it('rejects three contexts', () => {
    expect(
      ProfileSkillRecordSchema.safeParse({ ...base, contexts: [professional, personal, 'x#y'] })
        .success,
    ).toBe(false);
  });
});
