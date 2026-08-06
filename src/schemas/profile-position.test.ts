import { describe, expect, it } from 'vitest';
import { ProfilePositionRecordSchema } from './profile-position.js';

const base = {
  title: 'Engineer',
  startedAt: '2020-01-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
};

describe('ProfilePositionRecordSchema entityRef', () => {
  it('accepts an http(s) entityRef', () => {
    const parsed = ProfilePositionRecordSchema.parse({
      ...base,
      entityRef: 'http://www.wikidata.org/entity/Q9001',
    });
    expect(parsed.entityRef).toBe('http://www.wikidata.org/entity/Q9001');
  });

  it('rejects a javascript: scheme entityRef', () => {
    expect(() =>
      ProfilePositionRecordSchema.parse({ ...base, entityRef: 'javascript:alert(1)' }),
    ).toThrow();
  });

  it('is optional (free-text position)', () => {
    expect(ProfilePositionRecordSchema.parse(base).entityRef).toBeUndefined();
  });
});

describe('ProfilePositionRecordSchema onBehalfOf', () => {
  // A board seat held as a fund's representative means the person answers to a third
  // party. That is a disclosure rather than a role type, so it is its own field.
  it('accepts the full representation triple', () => {
    const parsed = ProfilePositionRecordSchema.parse({
      ...base,
      employmentType: 'id.sifa.defs#boardMember',
      onBehalfOf: 'Leodor Ventures',
      onBehalfOfDid: 'did:plc:abc123',
      onBehalfOfEntityRef: 'http://www.wikidata.org/entity/Q42',
    });
    expect(parsed.onBehalfOf).toBe('Leodor Ventures');
    expect(parsed.onBehalfOfDid).toBe('did:plc:abc123');
    expect(parsed.onBehalfOfEntityRef).toBe('http://www.wikidata.org/entity/Q42');
  });

  it('is entirely optional (independent seats omit it)', () => {
    const parsed = ProfilePositionRecordSchema.parse(base);
    expect(parsed.onBehalfOf).toBeUndefined();
  });

  it('accepts a free-text party with no resolved reference', () => {
    const parsed = ProfilePositionRecordSchema.parse({ ...base, onBehalfOf: 'A family office' });
    expect(parsed.onBehalfOf).toBe('A family office');
  });

  it('rejects a script-bearing onBehalfOfEntityRef', () => {
    expect(() =>
      ProfilePositionRecordSchema.parse({ ...base, onBehalfOfEntityRef: 'javascript:alert(1)' }),
    ).toThrow();
  });

  it('rejects a malformed onBehalfOfDid', () => {
    expect(() =>
      ProfilePositionRecordSchema.parse({ ...base, onBehalfOfDid: 'not-a-did' }),
    ).toThrow();
  });

  // Matches the lexicon's 256 graphemes. Being stricter than the lexicon would reject
  // records other clients can legally write.
  it('caps onBehalfOf at the lexicon grapheme limit', () => {
    expect(() =>
      ProfilePositionRecordSchema.parse({ ...base, onBehalfOf: 'x'.repeat(257) }),
    ).toThrow();
    expect(
      ProfilePositionRecordSchema.parse({ ...base, onBehalfOf: 'x'.repeat(256) }).onBehalfOf,
    ).toHaveLength(256);
  });
});
