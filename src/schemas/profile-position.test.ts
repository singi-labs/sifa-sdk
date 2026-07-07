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
