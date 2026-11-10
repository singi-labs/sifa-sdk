import { describe, expect, it } from 'vitest';

import { PROFILE_TEXT_LIMITS, ProfileSelfRecordSchema } from './index.js';
import { ProfileSelfWriteSchema } from './write/index.js';

// sifa-lexicons 0.15.10: name honorifics on id.sifa.profile.self.
const createdAt = '2026-11-10T10:00:00.000Z';

describe('profile self honorifics', () => {
  it('keeps both fields on the record schema', () => {
    const record = { honorificPrefix: 'Dr.', honorificSuffix: 'PhD, OBE', createdAt };
    expect(ProfileSelfRecordSchema.parse(record)).toMatchObject(record);
  });

  it('accepts them on the write schema and enforces the 64-grapheme cap', () => {
    expect(ProfileSelfWriteSchema.safeParse({ honorificPrefix: 'Prof. Dr. ir.' }).success).toBe(
      true,
    );
    expect(ProfileSelfWriteSchema.safeParse({ honorificSuffix: 'a'.repeat(65) }).success).toBe(
      false,
    );
    expect(PROFILE_TEXT_LIMITS.honorificPrefix).toEqual({ graphemes: 64, bytes: 640 });
    expect(PROFILE_TEXT_LIMITS.honorificSuffix).toEqual({ graphemes: 64, bytes: 640 });
  });
});
