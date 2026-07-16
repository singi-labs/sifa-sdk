import { describe, expect, it } from 'vitest';

import {
  CertificationWriteSchema,
  CourseWriteSchema,
  EducationWriteSchema,
  ExternalAccountWriteSchema,
  HonorWriteSchema,
  InvolvementWriteSchema,
  LanguageWriteSchema,
  OrgEmploymentAttestationWriteSchema,
  OrgProfileWriteSchema,
  PositionWriteSchema,
  PresentationDeliveryWriteSchema,
  PresentationWriteSchema,
  ProfileLocationWriteSchema,
  ProfileSelfWriteSchema,
  ProjectWriteSchema,
  PublicationWriteSchema,
  SkillWriteSchema,
  VALID_PLATFORMS,
  VolunteeringWriteSchema,
  httpUrlOrNull,
  isValidDateOnly,
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

describe('httpUrlOrNull', () => {
  it('returns the string for http(s)', () => {
    expect(httpUrlOrNull('https://x.com')).toBe('https://x.com');
    expect(httpUrlOrNull('http://x.com')).toBe('http://x.com');
  });
  it('blocks dangerous schemes and garbage', () => {
    expect(httpUrlOrNull('javascript:alert(1)')).toBeNull();
    expect(httpUrlOrNull('data:text/html,x')).toBeNull();
    expect(httpUrlOrNull('not a url')).toBeNull();
    expect(httpUrlOrNull(42)).toBeNull();
  });
});

describe('isValidDateOnly', () => {
  it('accepts real dates in YYYY-MM-DD form', () => {
    expect(isValidDateOnly('2024-01-15')).toBe(true);
    expect(isValidDateOnly('2000-02-29')).toBe(true); // leap year
  });
  it('rejects impossible dates and wrong shapes', () => {
    expect(isValidDateOnly('2024-02-30')).toBe(false);
    expect(isValidDateOnly('2024-13-01')).toBe(false);
    expect(isValidDateOnly('2024-1-1')).toBe(false);
    expect(isValidDateOnly('not a date')).toBe(false);
    expect(isValidDateOnly(1234)).toBe(false);
  });
});

describe('PositionWriteSchema (entityRef added in this PR)', () => {
  it('accepts a valid https entityRef', () => {
    expect(
      PositionWriteSchema.safeParse({
        title: 'Engineer',
        entityRef: 'https://www.wikidata.org/wiki/Q123',
      }).success,
    ).toBe(true);
  });
  it('rejects an ftp:// entityRef', () => {
    expect(
      PositionWriteSchema.safeParse({
        title: 'Engineer',
        entityRef: 'ftp://example.com/x',
      }).success,
    ).toBe(false);
  });
});

describe('CourseWriteSchema (credential + completedAt added in this PR)', () => {
  it('accepts a course with an at-uri credential reference', () => {
    expect(
      CourseWriteSchema.safeParse({
        name: 'Algorithms',
        credential: 'at://did:plc:x/id.sifa.profile.certification/y',
        completedAt: '2024-01-15T00:00:00.000Z',
      }).success,
    ).toBe(true);
  });
  it('rejects a non-at-uri credential', () => {
    expect(
      CourseWriteSchema.safeParse({
        name: 'Algorithms',
        credential: 'https://example.com/cert',
      }).success,
    ).toBe(false);
  });
});

describe('PublicationWriteSchema (subtitle added in this PR)', () => {
  it('accepts subtitle up to 2000 chars', () => {
    expect(
      PublicationWriteSchema.safeParse({
        title: 'Paper',
        subtitle: 'A subtitle',
      }).success,
    ).toBe(true);
    expect(
      PublicationWriteSchema.safeParse({
        title: 'Paper',
        subtitle: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe('InvolvementWriteSchema', () => {
  it('accepts minimum kind + rejects non-DID upstreamDid', () => {
    expect(InvolvementWriteSchema.safeParse({ kind: 'maintainer' }).success).toBe(true);
    expect(
      InvolvementWriteSchema.safeParse({
        kind: 'maintainer',
        upstreamDid: 'not-a-did',
      }).success,
    ).toBe(false);
  });
  it('accepts artifact links with http(s) URLs; rejects javascript:', () => {
    expect(
      InvolvementWriteSchema.safeParse({
        kind: 'contributor',
        links: [{ url: 'https://github.com/x/y/pull/1' }],
      }).success,
    ).toBe(true);
    expect(
      InvolvementWriteSchema.safeParse({
        kind: 'contributor',
        links: [{ url: 'javascript:alert(1)' }],
      }).success,
    ).toBe(false);
  });
});

describe('PresentationWriteSchema', () => {
  it('accepts a minimum presentation', () => {
    expect(PresentationWriteSchema.safeParse({ title: 'On distributed systems' }).success).toBe(
      true,
    );
  });
  it('rejects maxMinutes < minMinutes', () => {
    expect(
      PresentationWriteSchema.safeParse({
        title: 'Talk',
        duration: { minMinutes: 30, maxMinutes: 20 },
      }).success,
    ).toBe(false);
  });
  it('accepts maxMinutes >= minMinutes', () => {
    expect(
      PresentationWriteSchema.safeParse({
        title: 'Talk',
        duration: { minMinutes: 30, maxMinutes: 45 },
      }).success,
    ).toBe(true);
  });
});

describe('PresentationDeliveryWriteSchema', () => {
  it('accepts a date in YYYY-MM-DD; rejects an impossible date', () => {
    expect(PresentationDeliveryWriteSchema.safeParse({ date: '2024-06-15' }).success).toBe(true);
    expect(PresentationDeliveryWriteSchema.safeParse({ date: '2024-02-30' }).success).toBe(false);
  });
  it('rejects coSpeakers that are not DIDs', () => {
    expect(
      PresentationDeliveryWriteSchema.safeParse({
        coSpeakers: ['did:plc:x', 'not-a-did'],
      }).success,
    ).toBe(false);
  });
});

describe('OrgProfileWriteSchema', () => {
  it('requires name and createdAt', () => {
    expect(OrgProfileWriteSchema.safeParse({ name: 'Acme', createdAt: '2024-01-01' }).success).toBe(
      true,
    );
    expect(OrgProfileWriteSchema.safeParse({ name: '', createdAt: '2024-01-01' }).success).toBe(
      false,
    );
    expect(OrgProfileWriteSchema.safeParse({ name: 'Acme' }).success).toBe(false);
  });
});

describe('OrgEmploymentAttestationWriteSchema', () => {
  it('accepts a minimal attestation', () => {
    expect(
      OrgEmploymentAttestationWriteSchema.safeParse({
        subject: 'did:plc:sub',
        position: { uri: 'at://did:plc:x/id.sifa.profile.position/y' },
        status: 'current',
        title: 'Engineer',
        startedAt: '2024-01',
        createdAt: '2024-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
  it('rejects status outside enum', () => {
    expect(
      OrgEmploymentAttestationWriteSchema.safeParse({
        subject: 'did:plc:sub',
        position: { uri: 'at://did:plc:x/id.sifa.profile.position/y' },
        status: 'lapsed',
        title: 'Engineer',
        startedAt: '2024-01',
        createdAt: '2024-01-01T00:00:00Z',
      }).success,
    ).toBe(false);
  });
});
