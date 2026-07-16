import { describe, expect, it } from 'vitest';

import {
  CertificationWriteSchema,
  CourseWriteSchema,
  EducationWriteSchema,
  ExternalAccountWriteSchema,
  HonorWriteSchema,
  LanguageWriteSchema,
  PositionWriteSchema,
  ProfileLocationWriteSchema,
  ProfileSelfWriteSchema,
  ProjectWriteSchema,
  PublicationWriteSchema,
  SkillWriteSchema,
  VALID_PLATFORMS,
  VolunteeringWriteSchema,
  normalizeUrl,
  optionalUrl,
} from './index.js';

describe('PositionWriteSchema', () => {
  it('accepts a minimal position with only a title', () => {
    // company is optional to support freelancer / independent employment.
    // If sifa-api's current behavior differs, that's the bug this schema fixes.
    expect(PositionWriteSchema.safeParse({ title: 'Freelance developer' }).success).toBe(true);
  });

  it('accepts a full position with company', () => {
    const parsed = PositionWriteSchema.safeParse({
      company: 'Acme Corp',
      title: 'Staff engineer',
      description: 'Building distributed systems',
      employmentType: 'full-time',
      startedAt: '2020-01',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty title', () => {
    expect(PositionWriteSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects a title over 256 chars', () => {
    expect(PositionWriteSchema.safeParse({ title: 'x'.repeat(257) }).success).toBe(false);
  });

  it('accepts explicit null on optional fields (API echo shape)', () => {
    const parsed = PositionWriteSchema.safeParse({
      title: 'Engineer',
      company: null,
      description: null,
      startedAt: null,
      endedAt: null,
    });
    expect(parsed.success).toBe(true);
  });
});

describe('EducationWriteSchema', () => {
  it('requires institution', () => {
    expect(EducationWriteSchema.safeParse({ institution: '' }).success).toBe(false);
    expect(EducationWriteSchema.safeParse({ institution: 'MIT' }).success).toBe(true);
  });
});

describe('SkillWriteSchema', () => {
  it('requires name and caps at 100 chars', () => {
    expect(SkillWriteSchema.safeParse({ name: '' }).success).toBe(false);
    expect(SkillWriteSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false);
    expect(SkillWriteSchema.safeParse({ name: 'TypeScript', category: 'technical' }).success).toBe(
      true,
    );
  });
});

describe('CertificationWriteSchema', () => {
  it('accepts a bare name; drops invalid URLs via optionalUrl transform', () => {
    const parsed = CertificationWriteSchema.safeParse({
      name: 'CKA',
      credentialUrl: 'not-a-url',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.credentialUrl).toBeUndefined();
  });
});

describe('HonorWriteSchema', () => {
  it('no company field; title required, issuer optional (per product intent)', () => {
    expect(HonorWriteSchema.safeParse({ title: 'Award' }).success).toBe(true);
    expect(HonorWriteSchema.safeParse({ title: 'Award', issuer: null }).success).toBe(true);
  });
});

describe('CourseWriteSchema', () => {
  it('no company field; name required, institution optional (per product intent)', () => {
    expect(CourseWriteSchema.safeParse({ name: 'Distributed Systems' }).success).toBe(true);
    expect(CourseWriteSchema.safeParse({ name: 'Algorithms', institution: null }).success).toBe(
      true,
    );
  });
});

describe('ProjectWriteSchema, PublicationWriteSchema, VolunteeringWriteSchema, LanguageWriteSchema', () => {
  it('all accept their minimal required inputs', () => {
    expect(ProjectWriteSchema.safeParse({ name: 'Sifa' }).success).toBe(true);
    expect(PublicationWriteSchema.safeParse({ title: 'A paper' }).success).toBe(true);
    expect(VolunteeringWriteSchema.safeParse({ organization: 'Red Cross' }).success).toBe(true);
    expect(LanguageWriteSchema.safeParse({ name: 'Dutch' }).success).toBe(true);
  });
});

describe('ProfileSelfWriteSchema', () => {
  it('.passthrough() means unknown fields are preserved (intentional)', () => {
    const parsed = ProfileSelfWriteSchema.safeParse({
      headline: 'Engineer',
      // Simulates a new field the API accepts before the client SDK knows about it.
      unknownFutureField: 'some value',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect((parsed.data as Record<string, unknown>).unknownFutureField).toBe('some value');
    }
  });

  it('caps headline at 300', () => {
    expect(ProfileSelfWriteSchema.safeParse({ headline: 'x'.repeat(301) }).success).toBe(false);
  });
});

describe('ProfileLocationWriteSchema', () => {
  it('requires address and type', () => {
    expect(
      ProfileLocationWriteSchema.safeParse({
        address: { country: 'NL' },
        type: 'primary',
      }).success,
    ).toBe(true);

    expect(
      ProfileLocationWriteSchema.safeParse({
        address: { country: 'NL' },
        // missing type
      }).success,
    ).toBe(false);
  });
});

describe('ExternalAccountWriteSchema', () => {
  it('rejects platforms outside VALID_PLATFORMS', () => {
    expect(
      ExternalAccountWriteSchema.safeParse({
        platform: 'bluesky', // Deliberately NOT in VALID_PLATFORMS today.
        url: 'https://bsky.app/profile/x',
      }).success,
    ).toBe(false);
  });

  it('accepts known platforms and normalizes bare hostnames', () => {
    const parsed = ExternalAccountWriteSchema.safeParse({
      platform: 'github',
      url: 'github.com/gxjansen',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.url).toBe('https://github.com/gxjansen');
  });
});

describe('VALID_PLATFORMS', () => {
  it('is a stable readonly tuple with `other` present', () => {
    expect(VALID_PLATFORMS).toContain('other');
    expect(VALID_PLATFORMS).toContain('github');
    // Reference stability
    const a = VALID_PLATFORMS;
    const b = VALID_PLATFORMS;
    expect(a).toBe(b);
  });
});

describe('normalizeUrl + optionalUrl', () => {
  it('normalizeUrl prepends https:// when scheme absent', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('http://x.com')).toBe('http://x.com');
    expect(normalizeUrl('https://x.com')).toBe('https://x.com');
  });

  it('optionalUrl drops invalid values to undefined without raising', () => {
    const schema = optionalUrl();
    expect(schema.parse('https://x.com')).toBe('https://x.com');
    expect(schema.parse('not a url')).toBeUndefined();
    expect(schema.parse(undefined)).toBeUndefined();
  });
});
