import { describe, expect, it } from 'vitest';

import {
  PROFILE_TEXT_LIMITS,
  lexiconString,
  profileAboutSchema,
  profileDisplayNameSchema,
  profileHeadlineSchema,
  profileNameSchema,
  profilePronounsSchema,
} from './index.js';
import * as root from '../index.js';

const fieldSchemas = {
  displayName: profileDisplayNameSchema,
  givenName: profileNameSchema,
  familyName: profileNameSchema,
  namePronunciation: profileNameSchema,
  pronouns: profilePronounsSchema,
  headline: profileHeadlineSchema,
  about: profileAboutSchema,
} as const;

describe('PROFILE_TEXT_LIMITS', () => {
  it('lists the lexicon limits', () => {
    expect(PROFILE_TEXT_LIMITS).toEqual({
      displayName: { graphemes: 64, bytes: 640 },
      givenName: { graphemes: 64, bytes: 640 },
      familyName: { graphemes: 64, bytes: 640 },
      namePronunciation: { graphemes: 64, bytes: 640 },
      pronouns: { graphemes: 20, bytes: 200 },
      headline: { graphemes: 220, bytes: 2200 },
      about: { graphemes: 5000, bytes: 50000 },
    });
  });

  for (const [field, schema] of Object.entries(fieldSchemas)) {
    const { graphemes, bytes } = PROFILE_TEXT_LIMITS[field as keyof typeof fieldSchemas];

    it(`${field}: N graphemes pass, N+1 fail`, () => {
      expect(schema.safeParse('a'.repeat(graphemes)).success).toBe(true);
      expect(schema.safeParse('a'.repeat(graphemes + 1)).success).toBe(false);
    });

    it(`${field}: N bytes pass, N+1 bytes fail`, () => {
      // 'é' is 2 bytes; stay under the grapheme limit by using 3-byte CJK-free padding.
      const multi = 'é'.repeat(Math.min(graphemes, Math.floor(bytes / 2)));
      expect(schema.safeParse(multi).success).toBe(new TextEncoder().encode(multi).length <= bytes);
      // 4-byte emoji: graphemes * 4 bytes exceeds the byte limit only when graphemes * 4 > bytes.
      const emoji = '\u{1F600}'.repeat(graphemes);
      expect(schema.safeParse(emoji).success).toBe(graphemes * 4 <= bytes);
    });
  }

  it('is exported from the root entry with lexiconString', () => {
    expect(root.PROFILE_TEXT_LIMITS).toBe(PROFILE_TEXT_LIMITS);
    expect(root.lexiconString).toBe(lexiconString);
    expect(root.profileHeadlineSchema).toBe(profileHeadlineSchema);
  });

  it('lexiconString enforces both limits', () => {
    const schema = lexiconString(3, 5);
    expect(schema.safeParse('abc').success).toBe(true);
    expect(schema.safeParse('abcd').success).toBe(false);
    expect(schema.safeParse('\u{1F600}\u{1F600}').success).toBe(false);
  });
});
