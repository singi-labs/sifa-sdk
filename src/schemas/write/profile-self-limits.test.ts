import { describe, expect, it } from 'vitest';

import { ProfileSelfRecordSchema } from '../profile-self.js';
import { maxBytes } from '../shared.js';
import { ProfileOverrideWriteSchema, ProfileSelfWriteSchema } from './index.js';

// id.sifa.profile.self lexicon limits (sifa-lexicons): maxGraphemes counts
// user-perceived characters, maxLength counts UTF-8 bytes.
const FAMILY_ZWJ = '👨‍👩‍👧‍👦'; // 1 grapheme, 25 UTF-8 bytes
const E_COMBINING = 'é'; // 1 grapheme, 3 UTF-8 bytes
const GRINNING = '😀'; // 1 grapheme, 4 UTF-8 bytes

const SELF_FIELDS = [
  { field: 'headline', graphemes: 120, bytes: 1200 },
  { field: 'about', graphemes: 5000, bytes: 50000 },
  { field: 'givenName', graphemes: 64, bytes: 640 },
  { field: 'familyName', graphemes: 64, bytes: 640 },
  { field: 'namePronunciation', graphemes: 64, bytes: 640 },
] as const;

const OVERRIDE_FIELDS = [
  { field: 'displayName', graphemes: 64, bytes: 640 },
  { field: 'pronouns', graphemes: 20, bytes: 200 },
  { field: 'headline', graphemes: 120, bytes: 1200 },
  { field: 'about', graphemes: 5000, bytes: 50000 },
] as const;

const SUITES = [
  { name: 'ProfileSelfWriteSchema', schema: ProfileSelfWriteSchema, fields: SELF_FIELDS },
  {
    name: 'ProfileOverrideWriteSchema',
    schema: ProfileOverrideWriteSchema,
    fields: OVERRIDE_FIELDS,
  },
];

describe('maxBytes', () => {
  it('counts UTF-8 bytes, not UTF-16 units', () => {
    expect(maxBytes(4)(GRINNING)).toBe(true);
    expect(maxBytes(3)(GRINNING)).toBe(false);
    expect(maxBytes(2)('é')).toBe(true);
    expect(maxBytes(1)('é')).toBe(false);
  });
});

for (const { name, schema, fields } of SUITES) {
  describe(`${name} lexicon limits`, () => {
    for (const { field, graphemes, bytes } of fields) {
      describe(field, () => {
        const ok = (value: unknown) => schema.safeParse({ [field]: value }).success;

        it(`accepts ${graphemes} graphemes and rejects ${graphemes + 1}`, () => {
          expect(ok('a'.repeat(graphemes))).toBe(true);
          expect(ok('a'.repeat(graphemes + 1))).toBe(false);
        });

        it('rejects a value within the grapheme limit but over the byte limit', () => {
          // 4-byte emoji: graphemes stays under the cap while bytes exceed it.
          const count = Math.floor(bytes / 4) + 1;
          if (count <= graphemes) {
            expect(ok(GRINNING.repeat(count))).toBe(false);
            expect(ok(GRINNING.repeat(count - 1))).toBe(true);
          } else {
            // Grapheme cap binds first (about: 5000 < 12501); use a wide ZWJ run.
            const wide = Math.floor(bytes / 25) + 1;
            expect(wide).toBeLessThanOrEqual(graphemes);
            expect(ok(FAMILY_ZWJ.repeat(wide))).toBe(false);
            expect(ok(FAMILY_ZWJ.repeat(wide - 1))).toBe(true);
          }
        });

        it('counts a ZWJ emoji sequence as one grapheme', () => {
          expect(ok(FAMILY_ZWJ.repeat(Math.min(graphemes, Math.floor(bytes / 25))))).toBe(true);
          expect(ok(FAMILY_ZWJ + 'a'.repeat(graphemes - 1))).toBe(
            Buffer.byteLength(FAMILY_ZWJ + 'a'.repeat(graphemes - 1)) <= bytes,
          );
        });

        it('counts a combining mark as part of one grapheme', () => {
          expect(ok(E_COMBINING.repeat(graphemes))).toBe(
            Buffer.byteLength(E_COMBINING.repeat(graphemes)) <= bytes,
          );
          expect(ok(E_COMBINING.repeat(graphemes + 1))).toBe(false);
        });

        it('reports only the character error for an over-long value', () => {
          const result = schema.safeParse({ [field]: FAMILY_ZWJ.repeat(graphemes + 1) });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues).toHaveLength(1);
          }
        });

        it('explains a byte overflow in plain words', () => {
          const wide = Math.floor(bytes / 25) + 1;
          const result = schema.safeParse({ [field]: FAMILY_ZWJ.repeat(wide) });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
              'This text is too long. Emoji and some scripts take more space, so shorten it a little.',
            );
          }
        });

        it('reads as a character limit in the error message', () => {
          const result = schema.safeParse({ [field]: 'a'.repeat(graphemes + 1) });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(`Must be at most ${graphemes} characters`);
          }
        });
      });
    }
  });
}

describe('ProfileOverrideWriteSchema shape', () => {
  it('accepts null and undefined for every field', () => {
    expect(
      ProfileOverrideWriteSchema.safeParse({
        headline: null,
        about: null,
        displayName: null,
        pronouns: null,
      }).success,
    ).toBe(true);
    expect(ProfileOverrideWriteSchema.safeParse({}).success).toBe(true);
  });
});

describe('ProfileSelfWriteSchema passthrough', () => {
  it('still preserves unknown keys', () => {
    const parsed = ProfileSelfWriteSchema.safeParse({ headline: 'x', futureKey: 1 });
    expect(parsed.success && (parsed.data as Record<string, unknown>).futureKey).toBe(1);
  });
});

describe('ProfileSelfRecordSchema lexicon limits', () => {
  const RECORD_FIELDS = [
    ...SELF_FIELDS,
    { field: 'displayName', graphemes: 64, bytes: 640 },
    { field: 'pronouns', graphemes: 20, bytes: 200 },
  ] as const;

  for (const { field, graphemes, bytes } of RECORD_FIELDS) {
    it(`${field}: enforces ${graphemes} graphemes and ${bytes} bytes`, () => {
      const ok = (value: string) =>
        ProfileSelfRecordSchema.safeParse({ createdAt: '2026-01-01T00:00:00.000Z', [field]: value })
          .success;
      expect(ok('a'.repeat(graphemes))).toBe(true);
      expect(ok('a'.repeat(graphemes + 1))).toBe(false);
      const wide = Math.floor(bytes / 25) + 1;
      expect(ok(FAMILY_ZWJ.repeat(wide))).toBe(false);
      expect(ok(FAMILY_ZWJ.repeat(wide - 1))).toBe(true);
    });
  }
});
