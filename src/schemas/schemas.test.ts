import { describe, expect, it } from 'vitest';

import {
  EndorsementConfirmationRecordSchema,
  EndorsementRecordSchema,
  GraphFollowRecordSchema,
  ProfileCertificationRecordSchema,
  ProfileCourseRecordSchema,
  ProfileEducationRecordSchema,
  ProfileExternalAccountRecordSchema,
  ProfileHonorRecordSchema,
  ProfileLanguageRecordSchema,
  ProfilePositionRecordSchema,
  ProfilePresentationRecordSchema,
  ProfilePresentationDeliveryRecordSchema,
  ProfileProjectRecordSchema,
  ProfilePublicationRecordSchema,
  ProfileSelfRecordSchema,
  ProfileSkillRecordSchema,
  ProfileVolunteeringRecordSchema,
  atUriSchema,
  cidSchema,
  datetimeSchema,
  didSchema,
  languageTagSchema,
  maxGraphemes,
  strongRefSchema,
  uriSchema,
} from './index.js';

const NOW = '2026-05-15T10:00:00.000Z';
const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
const AT_URI = `at://${DID}/id.sifa.profile.skill/3kabcdefghijk`;
const CID = 'bafyreigh2akiscaildc7w4yp5uqjpyleg5tuq3oj4d2lrhhrmm56c2u3qe';
const STRONG_REF = { uri: AT_URI, cid: CID };

describe('shared format helpers', () => {
  it('didSchema accepts valid did:plc and rejects bare strings', () => {
    expect(didSchema.safeParse(DID).success).toBe(true);
    expect(didSchema.safeParse('did:web:example.com').success).toBe(true);
    expect(didSchema.safeParse('plc:abc').success).toBe(false);
    expect(didSchema.safeParse('').success).toBe(false);
  });

  it('datetimeSchema accepts RFC 3339 with Z or offset', () => {
    expect(datetimeSchema.safeParse('2026-05-15T10:00:00.000Z').success).toBe(true);
    expect(datetimeSchema.safeParse('2026-05-15T10:00:00+02:00').success).toBe(true);
    expect(datetimeSchema.safeParse('2026-05-15').success).toBe(false);
    expect(datetimeSchema.safeParse('not a date').success).toBe(false);
  });

  it('atUriSchema requires at:// prefix', () => {
    expect(atUriSchema.safeParse(AT_URI).success).toBe(true);
    expect(atUriSchema.safeParse('https://example.com').success).toBe(false);
  });

  it('cidSchema accepts base32 CIDv1 and CIDv0', () => {
    expect(cidSchema.safeParse(CID).success).toBe(true);
    expect(cidSchema.safeParse('QmYwAPJzv5CZsnAzt8auVZRn1yQDuhRbN5ozCJWLpr2Vs9').success).toBe(
      true,
    );
    expect(cidSchema.safeParse('not-a-cid').success).toBe(false);
  });

  it('uriSchema accepts http(s) URLs', () => {
    expect(uriSchema.safeParse('https://example.com').success).toBe(true);
    expect(uriSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('languageTagSchema accepts BCP 47', () => {
    expect(languageTagSchema.safeParse('en').success).toBe(true);
    expect(languageTagSchema.safeParse('en-US').success).toBe(true);
    expect(languageTagSchema.safeParse('nl-NL').success).toBe(true);
    expect(languageTagSchema.safeParse('').success).toBe(false);
  });

  it('strongRefSchema requires both uri and cid', () => {
    expect(strongRefSchema.safeParse(STRONG_REF).success).toBe(true);
    expect(strongRefSchema.safeParse({ uri: AT_URI }).success).toBe(false);
    expect(strongRefSchema.safeParse({ cid: CID }).success).toBe(false);
  });

  it('maxGraphemes counts grapheme clusters, not UTF-16 units', () => {
    const check = maxGraphemes(3);
    expect(check('abc')).toBe(true);
    expect(check('abcd')).toBe(false);
    // Family ZWJ sequence is 1 grapheme even though it is many code units
    expect(check('👨‍👩‍👧')).toBe(true);
    // Two flags = 2 graphemes; well under 3
    expect(check('🇳🇱🇺🇸')).toBe(true);
  });
});

describe('ProfileSkillRecordSchema', () => {
  it('accepts a minimal valid record', () => {
    const result = ProfileSkillRecordSchema.safeParse({ name: 'TypeScript', createdAt: NOW });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(ProfileSkillRecordSchema.safeParse({ name: '', createdAt: NOW }).success).toBe(false);
  });

  it('rejects name over 64 graphemes', () => {
    const name = 'x'.repeat(65);
    expect(ProfileSkillRecordSchema.safeParse({ name, createdAt: NOW }).success).toBe(false);
  });

  it('allows unknown category (knownValues is advisory)', () => {
    const result = ProfileSkillRecordSchema.safeParse({
      name: 'Cooking',
      category: 'made-up-category',
      createdAt: NOW,
    });
    expect(result.success).toBe(true);
  });
});

describe('ProfilePositionRecordSchema', () => {
  it('accepts a minimal valid record', () => {
    const result = ProfilePositionRecordSchema.safeParse({
      company: 'Sifa',
      title: 'Founder',
      startedAt: NOW,
      createdAt: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a self-employed record without company', () => {
    const result = ProfilePositionRecordSchema.safeParse({
      title: 'Independent Consultant',
      employmentType: 'id.sifa.defs#selfEmployed',
      startedAt: NOW,
      createdAt: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty company string when present', () => {
    const result = ProfilePositionRecordSchema.safeParse({
      company: '',
      title: 'Founder',
      startedAt: NOW,
      createdAt: NOW,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional employmentType / workplaceType strings', () => {
    const result = ProfilePositionRecordSchema.safeParse({
      company: 'Sifa',
      title: 'Founder',
      employmentType: 'id.sifa.defs#fullTime',
      workplaceType: 'id.sifa.defs#remote',
      startedAt: NOW,
      createdAt: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(
      ProfilePositionRecordSchema.safeParse({ company: 'Sifa', title: 'Founder', createdAt: NOW })
        .success,
    ).toBe(false);
  });

  it('rejects skills array over 50 entries', () => {
    const skills = Array.from({ length: 51 }, () => STRONG_REF);
    expect(
      ProfilePositionRecordSchema.safeParse({
        company: 'Sifa',
        title: 'Founder',
        startedAt: NOW,
        createdAt: NOW,
        skills,
      }).success,
    ).toBe(false);
  });

  it('accepts location as opaque unknown (community lexicon shape)', () => {
    const result = ProfilePositionRecordSchema.safeParse({
      company: 'Sifa',
      title: 'Founder',
      startedAt: NOW,
      createdAt: NOW,
      location: { country: 'NL', locality: 'Amsterdam' },
    });
    expect(result.success).toBe(true);
  });
});

describe('ProfileEducationRecordSchema', () => {
  it('requires institution and createdAt', () => {
    expect(ProfileEducationRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
    expect(
      ProfileEducationRecordSchema.safeParse({ institution: 'TU Delft', createdAt: NOW }).success,
    ).toBe(true);
  });
});

describe('ProfileSelfRecordSchema', () => {
  it('requires only createdAt', () => {
    expect(ProfileSelfRecordSchema.safeParse({ createdAt: NOW }).success).toBe(true);
  });

  it('rejects headline over 120 graphemes', () => {
    const headline = 'x'.repeat(121);
    expect(ProfileSelfRecordSchema.safeParse({ headline, createdAt: NOW }).success).toBe(false);
  });

  it('caps preferredWorkplace at 3', () => {
    const result = ProfileSelfRecordSchema.safeParse({
      preferredWorkplace: ['a', 'b', 'c', 'd'],
      createdAt: NOW,
    });
    expect(result.success).toBe(false);
  });

  it('accepts discoverable as a boolean', () => {
    expect(ProfileSelfRecordSchema.safeParse({ discoverable: false, createdAt: NOW }).success).toBe(
      true,
    );
    expect(ProfileSelfRecordSchema.safeParse({ discoverable: true, createdAt: NOW }).success).toBe(
      true,
    );
  });

  it('treats discoverable as optional', () => {
    const parsed = ProfileSelfRecordSchema.parse({ createdAt: NOW });
    expect(parsed.discoverable).toBeUndefined();
  });

  it('rejects non-boolean discoverable values', () => {
    expect(ProfileSelfRecordSchema.safeParse({ discoverable: 'no', createdAt: NOW }).success).toBe(
      false,
    );
    expect(ProfileSelfRecordSchema.safeParse({ discoverable: 1, createdAt: NOW }).success).toBe(
      false,
    );
  });

  it('accepts givenName and familyName as optional strings', () => {
    expect(
      ProfileSelfRecordSchema.safeParse({
        givenName: 'Aisha',
        familyName: 'García-Hernández',
        createdAt: NOW,
      }).success,
    ).toBe(true);
    const parsed = ProfileSelfRecordSchema.parse({ createdAt: NOW });
    expect(parsed.givenName).toBeUndefined();
    expect(parsed.familyName).toBeUndefined();
  });

  it('caps givenName and familyName at 64 graphemes', () => {
    const long = 'a'.repeat(65);
    expect(ProfileSelfRecordSchema.safeParse({ givenName: long, createdAt: NOW }).success).toBe(
      false,
    );
    expect(ProfileSelfRecordSchema.safeParse({ familyName: long, createdAt: NOW }).success).toBe(
      false,
    );
  });

  it('rejects non-string givenName/familyName values', () => {
    expect(ProfileSelfRecordSchema.safeParse({ givenName: 42, createdAt: NOW }).success).toBe(
      false,
    );
    expect(ProfileSelfRecordSchema.safeParse({ familyName: true, createdAt: NOW }).success).toBe(
      false,
    );
  });
});

describe('ProfileCertificationRecordSchema', () => {
  it('accepts a minimal record', () => {
    expect(
      ProfileCertificationRecordSchema.safeParse({ name: 'AWS SAA', createdAt: NOW }).success,
    ).toBe(true);
  });

  it('validates credentialUrl format', () => {
    expect(
      ProfileCertificationRecordSchema.safeParse({
        name: 'AWS SAA',
        credentialUrl: 'not-a-url',
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });
});

describe('ProfileExternalAccountRecordSchema', () => {
  it('requires platform, url, createdAt', () => {
    expect(
      ProfileExternalAccountRecordSchema.safeParse({
        platform: 'id.sifa.defs#platformGithub',
        url: 'https://github.com/alice',
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });

  it('allows unknown platform values (advisory knownValues)', () => {
    expect(
      ProfileExternalAccountRecordSchema.safeParse({
        platform: 'custom-platform',
        url: 'https://example.com',
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });
});

describe('ProfilePublicationRecordSchema', () => {
  it('accepts authors array under limit', () => {
    expect(
      ProfilePublicationRecordSchema.safeParse({
        title: 'A Paper',
        authors: [{ name: 'Alice' }, { name: 'Bob', did: DID }],
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });

  it('rejects authors array over 50', () => {
    const authors = Array.from({ length: 51 }, (_, i) => ({ name: `Author ${i}` }));
    expect(
      ProfilePublicationRecordSchema.safeParse({
        title: 'A Paper',
        authors,
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });
});

describe('ProfileLanguageRecordSchema, ProfileVolunteeringRecordSchema, ProfileHonorRecordSchema, ProfileProjectRecordSchema, ProfileCourseRecordSchema', () => {
  it('language: requires name and createdAt', () => {
    expect(ProfileLanguageRecordSchema.safeParse({ name: 'English', createdAt: NOW }).success).toBe(
      true,
    );
    expect(ProfileLanguageRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('volunteering: requires organization', () => {
    expect(
      ProfileVolunteeringRecordSchema.safeParse({ organization: 'Red Cross', createdAt: NOW })
        .success,
    ).toBe(true);
    expect(ProfileVolunteeringRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('honor: requires title', () => {
    expect(
      ProfileHonorRecordSchema.safeParse({ title: 'Best Engineer', createdAt: NOW }).success,
    ).toBe(true);
    expect(ProfileHonorRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('project: requires name', () => {
    expect(ProfileProjectRecordSchema.safeParse({ name: 'sifa-sdk', createdAt: NOW }).success).toBe(
      true,
    );
    expect(ProfileProjectRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('course: requires name', () => {
    expect(ProfileCourseRecordSchema.safeParse({ name: 'CS101', createdAt: NOW }).success).toBe(
      true,
    );
    expect(ProfileCourseRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('course: accepts an at-uri credential, rejects a non-at-uri', () => {
    expect(
      ProfileCourseRecordSchema.safeParse({
        name: 'CS101',
        credential: 'at://did:plc:abc/id.sifa.profile.certification/xyz',
        createdAt: NOW,
      }).success,
    ).toBe(true);
    expect(
      ProfileCourseRecordSchema.safeParse({
        name: 'CS101',
        credential: 'not-an-at-uri',
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });
});

describe('EndorsementRecordSchema', () => {
  it('requires subject DID, strongRef skill, skillName, createdAt', () => {
    const result = EndorsementRecordSchema.safeParse({
      subject: DID,
      skill: STRONG_REF,
      skillName: 'TypeScript',
      createdAt: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed subject DID', () => {
    expect(
      EndorsementRecordSchema.safeParse({
        subject: 'not-a-did',
        skill: STRONG_REF,
        skillName: 'TypeScript',
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });
});

describe('EndorsementConfirmationRecordSchema', () => {
  it('requires endorsement strongRef and createdAt', () => {
    expect(
      EndorsementConfirmationRecordSchema.safeParse({
        endorsement: STRONG_REF,
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });
});

describe('GraphFollowRecordSchema', () => {
  it('requires subject DID and createdAt', () => {
    expect(GraphFollowRecordSchema.safeParse({ subject: DID, createdAt: NOW }).success).toBe(true);
    expect(GraphFollowRecordSchema.safeParse({ subject: 'bad', createdAt: NOW }).success).toBe(
      false,
    );
  });
});

describe('ProfilePresentationRecordSchema', () => {
  it('requires title and createdAt', () => {
    expect(
      ProfilePresentationRecordSchema.safeParse({ title: 'My talk', createdAt: NOW }).success,
    ).toBe(true);
    expect(ProfilePresentationRecordSchema.safeParse({ createdAt: NOW }).success).toBe(false);
  });

  it('accepts a fixed duration and a min/max range, rejects minMinutes < 1', () => {
    expect(
      ProfilePresentationRecordSchema.safeParse({
        title: 'T',
        duration: { minMinutes: 30 },
        createdAt: NOW,
      }).success,
    ).toBe(true);
    expect(
      ProfilePresentationRecordSchema.safeParse({
        title: 'T',
        duration: { minMinutes: 20, maxMinutes: 30 },
        createdAt: NOW,
      }).success,
    ).toBe(true);
    expect(
      ProfilePresentationRecordSchema.safeParse({
        title: 'T',
        duration: { minMinutes: 0 },
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });

  it('rejects a duration range where maxMinutes < minMinutes', () => {
    expect(
      ProfilePresentationRecordSchema.safeParse({
        title: 'T',
        duration: { minMinutes: 60, maxMinutes: 30 },
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });

  it('accepts multiple intendedAudiences, typed links, and a writeupRef with optional cid', () => {
    expect(
      ProfilePresentationRecordSchema.safeParse({
        title: 'T',
        intendedAudiences: ['Engineering leaders', 'Beginners'],
        links: [{ uri: 'https://example.com/slides', type: 'id.sifa.defs#linkSlides' }],
        writeupRef: { uri: AT_URI },
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });
});

describe('ProfilePresentationDeliveryRecordSchema', () => {
  it('requires only createdAt and works standalone (eventName/title, no refs)', () => {
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({
        title: 'My talk',
        eventName: 'DevConf',
        date: '2025-09-12',
        role: 'id.sifa.defs#presenter',
        createdAt: NOW,
      }).success,
    ).toBe(true);
    expect(ProfilePresentationDeliveryRecordSchema.safeParse({ createdAt: NOW }).success).toBe(
      true,
    );
  });

  it('accepts co-speaker DIDs and rejects a too-long or non-DID list', () => {
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({
        coSpeakers: ['did:plc:abc123', 'did:web:example.com'],
        createdAt: NOW,
      }).success,
    ).toBe(true);
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({
        coSpeakers: ['not-a-did'],
        createdAt: NOW,
      }).success,
    ).toBe(false);
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({
        coSpeakers: Array.from({ length: 21 }, (_, i) => `did:plc:x${i}`),
        createdAt: NOW,
      }).success,
    ).toBe(false);
  });

  it('accepts a presentationRef and eventRef without a cid, and community mode/status tokens', () => {
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({
        presentationRef: { uri: AT_URI },
        eventRef: { uri: AT_URI, cid: CID },
        mode: 'community.lexicon.calendar.event#virtual',
        status: 'community.lexicon.calendar.event#cancelled',
        createdAt: NOW,
      }).success,
    ).toBe(true);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({ date: '2025-09', createdAt: NOW })
        .success,
    ).toBe(false);
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({ date: '2025', createdAt: NOW }).success,
    ).toBe(false);
  });
});
