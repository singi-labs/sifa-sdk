import { describe, expect, it } from 'vitest';

import {
  ArtifactLinkSchema,
  PROFILE_INVOLVEMENT_NSID,
  ProfileInvolvementRecordSchema,
} from './profile-involvement.js';

const base = {
  kind: 'id.sifa.defs#involvementOpenSource',
  createdAt: '2020-01-01T00:00:00.000Z',
};

describe('PROFILE_INVOLVEMENT_NSID', () => {
  it('is the collection NSID', () => {
    expect(PROFILE_INVOLVEMENT_NSID).toBe('id.sifa.profile.involvement');
  });
});

describe('ProfileInvolvementRecordSchema', () => {
  it('accepts a minimal record (kind + createdAt)', () => {
    const parsed = ProfileInvolvementRecordSchema.parse(base);
    expect(parsed.kind).toBe('id.sifa.defs#involvementOpenSource');
  });

  it('requires kind', () => {
    expect(() => ProfileInvolvementRecordSchema.parse({ createdAt: base.createdAt })).toThrow();
  });

  it('leaves upstream optional (a one-off contribution need not name an org)', () => {
    expect(ProfileInvolvementRecordSchema.parse(base).upstream).toBeUndefined();
  });

  it('accepts an arbitrary kind string (open enum, matches lexicon knownValues)', () => {
    const parsed = ProfileInvolvementRecordSchema.parse({
      ...base,
      kind: 'id.sifa.defs#involvementFutureKind',
    });
    expect(parsed.kind).toBe('id.sifa.defs#involvementFutureKind');
  });

  it.each(['2018', '2018-06', '2018-06-15', '2020-01-01T00:00:00.000Z'])(
    'accepts the freeform/partial date %s',
    (date) => {
      const parsed = ProfileInvolvementRecordSchema.parse({ ...base, startedAt: date });
      expect(parsed.startedAt).toBe(date);
    },
  );

  it('rejects a non-date startedAt', () => {
    expect(() =>
      ProfileInvolvementRecordSchema.parse({ ...base, startedAt: 'June 2018' }),
    ).toThrow();
  });

  it('accepts a links array of artifact links', () => {
    const parsed = ProfileInvolvementRecordSchema.parse({
      ...base,
      links: [{ url: 'https://github.com/x/y/pull/1', kind: 'pull-request', label: 'PR #1' }],
    });
    expect(parsed.links?.[0]?.url).toBe('https://github.com/x/y/pull/1');
  });

  it('preserves unknown future fields (passthrough, forward-compat for co-writers)', () => {
    const parsed = ProfileInvolvementRecordSchema.parse({
      ...base,
      futureField: 'from a newer client',
    }) as Record<string, unknown>;
    expect(parsed.futureField).toBe('from a newer client');
  });

  it('accepts entityRef (http(s)), a location object, and skill refs', () => {
    const parsed = ProfileInvolvementRecordSchema.parse({
      ...base,
      entityRef: 'http://www.wikidata.org/entity/Q9135',
      location: { country: 'NL', locality: 'Utrecht' },
      skills: [{ uri: 'at://did:plc:x/id.sifa.profile.skill/abc' }],
    });
    expect(parsed.entityRef).toBe('http://www.wikidata.org/entity/Q9135');
    expect(parsed.skills?.[0]?.uri).toBe('at://did:plc:x/id.sifa.profile.skill/abc');
  });

  it('rejects a javascript: scheme entityRef', () => {
    expect(() =>
      ProfileInvolvementRecordSchema.parse({ ...base, entityRef: 'javascript:alert(1)' }),
    ).toThrow();
  });

  it('requires createdAt in datetime format', () => {
    expect(() => ProfileInvolvementRecordSchema.parse({ kind: base.kind })).toThrow();
    expect(() =>
      ProfileInvolvementRecordSchema.parse({ ...base, createdAt: '2020-01-01' }),
    ).toThrow();
  });
});

describe('ArtifactLinkSchema', () => {
  it('requires a url', () => {
    expect(() => ArtifactLinkSchema.parse({ kind: 'release' })).toThrow();
  });

  it('accepts url with optional kind and label', () => {
    const parsed = ArtifactLinkSchema.parse({
      url: 'https://example.com/r/1',
      kind: 'release',
      label: 'v1.0.0',
    });
    expect(parsed.url).toBe('https://example.com/r/1');
    expect(parsed.kind).toBe('release');
  });

  it('caps label at 200 graphemes', () => {
    expect(() =>
      ArtifactLinkSchema.parse({ url: 'https://example.com', label: 'x'.repeat(201) }),
    ).toThrow();
  });
});
