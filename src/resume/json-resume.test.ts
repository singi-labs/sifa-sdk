import { describe, expect, it } from 'vitest';

import { profileToJsonResume, toResumeDate } from './json-resume.js';

const minimal = { handle: 'gui.do' };

describe('toResumeDate', () => {
  it('passes a plain YYYY-MM-DD through unchanged', () => {
    expect(toResumeDate('2020-03-04')).toBe('2020-03-04');
  });

  it('passes a YYYY-MM through unchanged', () => {
    expect(toResumeDate('2020-03')).toBe('2020-03');
  });

  it('passes a bare year through unchanged', () => {
    expect(toResumeDate('2020')).toBe('2020');
  });

  // JSON Resume dates are ISO8601 dates, not datetimes. Sifa stores RFC 3339
  // for some fields, and a consumer that pastes a full timestamp into a CV
  // template renders "2020-03-04T00:00:00.000Z" on the page.
  it('trims an RFC 3339 datetime to its date part', () => {
    expect(toResumeDate('2020-03-04T00:00:00.000Z')).toBe('2020-03-04');
  });

  it('returns undefined for undefined', () => {
    expect(toResumeDate(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty or whitespace string', () => {
    expect(toResumeDate('')).toBeUndefined();
    expect(toResumeDate('   ')).toBeUndefined();
  });

  it('returns undefined for a string that is not a date', () => {
    expect(toResumeDate('present')).toBeUndefined();
  });
});

describe('profileToJsonResume basics', () => {
  it('prefers the structured name over displayName', () => {
    const r = profileToJsonResume({
      ...minimal,
      givenName: 'Guido',
      familyName: 'Jansen',
      displayName: 'gxjansen',
    });
    expect(r.basics?.name).toBe('Guido Jansen');
  });

  it('falls back to displayName, then to the handle', () => {
    expect(profileToJsonResume({ ...minimal, displayName: 'gxjansen' }).basics?.name).toBe(
      'gxjansen',
    );
    expect(profileToJsonResume(minimal).basics?.name).toBe('gui.do');
  });

  it('maps headline to label and about to summary', () => {
    const r = profileToJsonResume({
      ...minimal,
      headline: 'Community builder',
      about: 'Long form bio.',
    });
    expect(r.basics?.label).toBe('Community builder');
    expect(r.basics?.summary).toBe('Long form bio.');
  });

  it('uses the profile website as basics.url when set', () => {
    const r = profileToJsonResume({ ...minimal, website: 'https://gui.do' });
    expect(r.basics?.url).toBe('https://gui.do');
  });

  it('falls back to the canonical Sifa profile URL when there is no website', () => {
    expect(profileToJsonResume(minimal).basics?.url).toBe('https://sifa.id/p/gui.do');
  });

  it('honours a baseUrl override', () => {
    const r = profileToJsonResume(minimal, { baseUrl: 'https://staging.sifa.id' });
    expect(r.basics?.url).toBe('https://staging.sifa.id/p/gui.do');
  });

  it('maps location to the JSON Resume location shape', () => {
    const r = profileToJsonResume({
      ...minimal,
      location: {
        locality: 'Rotterdam',
        region: 'Zuid-Holland',
        country: 'Netherlands',
        countryCode: 'NL',
        postalCode: '3011',
      },
    });
    expect(r.basics?.location).toEqual({
      city: 'Rotterdam',
      region: 'Zuid-Holland',
      countryCode: 'NL',
      postalCode: '3011',
    });
  });

  it('omits basics.location entirely when there is no location', () => {
    expect(profileToJsonResume(minimal).basics?.location).toBeUndefined();
  });

  // Sifa never stores these; emitting empty strings would make a resume look
  // like it had been filled in and left blank.
  it('never emits email or phone', () => {
    const r = profileToJsonResume(minimal);
    expect(r.basics && 'email' in r.basics).toBe(false);
    expect(r.basics && 'phone' in r.basics).toBe(false);
  });

  it('maps visible external accounts to basics.profiles', () => {
    const r = profileToJsonResume({
      ...minimal,
      externalAccounts: [
        {
          rkey: '1',
          platform: 'github',
          url: 'https://github.com/gxjansen',
          label: 'gxjansen',
          verifiable: true,
          verified: true,
        },
        {
          rkey: '2',
          platform: 'mastodon',
          url: 'https://example.social/@x',
          verifiable: false,
          verified: false,
          hidden: true,
        },
      ],
    });
    expect(r.basics?.profiles).toEqual([
      { network: 'github', username: 'gxjansen', url: 'https://github.com/gxjansen' },
    ]);
  });
});

describe('profileToJsonResume work', () => {
  it('maps a position, preferring the resolved entity name over the stored company', () => {
    const r = profileToJsonResume({
      ...minimal,
      positions: [
        {
          rkey: '1',
          company: 'Twitter',
          entityName: 'X',
          title: 'Engineer',
          description: 'Did the work.',
          startedAt: '2020-03',
          endedAt: '2022-01',
        },
      ],
    });
    expect(r.work).toEqual([
      {
        name: 'X',
        position: 'Engineer',
        summary: 'Did the work.',
        startDate: '2020-03',
        endDate: '2022-01',
      },
    ]);
  });

  it('falls back to the stored company name when nothing is linked', () => {
    const r = profileToJsonResume({
      ...minimal,
      positions: [{ rkey: '1', company: 'Acme', title: 'Engineer', startedAt: '2020-03' }],
    });
    expect(r.work?.[0]?.name).toBe('Acme');
  });

  it('omits name for an independent position with no company', () => {
    const r = profileToJsonResume({
      ...minimal,
      positions: [{ rkey: '1', title: 'Freelance consultant', startedAt: '2020-03' }],
    });
    expect(r.work?.[0]?.position).toBe('Freelance consultant');
    expect(r.work?.[0] && 'name' in r.work[0]).toBe(false);
  });

  it('drops hidden positions', () => {
    const r = profileToJsonResume({
      ...minimal,
      positions: [
        { rkey: '1', title: 'Shown', startedAt: '2020-03' },
        { rkey: '2', title: 'Hidden', startedAt: '2020-03', hidden: true },
      ],
    });
    expect(r.work).toHaveLength(1);
    expect(r.work?.[0]?.position).toBe('Shown');
  });

  it('omits the work key entirely when every position is hidden', () => {
    const r = profileToJsonResume({
      ...minimal,
      positions: [{ rkey: '1', title: 'Hidden', startedAt: '2020-03', hidden: true }],
    });
    expect('work' in r).toBe(false);
  });
});

describe('profileToJsonResume education, awards, certificates', () => {
  it('maps education', () => {
    const r = profileToJsonResume({
      ...minimal,
      education: [
        {
          rkey: '1',
          institution: 'Utrecht University',
          degree: 'MSc',
          fieldOfStudy: 'Cognitive psychology',
          startedAt: '2004',
          endedAt: '2008',
        },
      ],
    });
    expect(r.education).toEqual([
      {
        institution: 'Utrecht University',
        studyType: 'MSc',
        area: 'Cognitive psychology',
        startDate: '2004',
        endDate: '2008',
      },
    ]);
  });

  it('maps honors to awards', () => {
    const r = profileToJsonResume({
      ...minimal,
      honors: [{ rkey: '1', title: 'Award', issuer: 'Body', date: '2021', description: 'For it.' }],
    });
    expect(r.awards).toEqual([
      { title: 'Award', awarder: 'Body', date: '2021', summary: 'For it.' },
    ]);
  });

  it('maps certifications, reading the canonical authority field', () => {
    const r = profileToJsonResume({
      ...minimal,
      certifications: [
        {
          rkey: '1',
          name: 'Cert',
          authority: 'Issuer',
          issueDate: '2021-06',
          credentialUrl: 'https://example.com/c',
        },
      ],
    });
    expect(r.certificates).toEqual([
      { name: 'Cert', issuer: 'Issuer', date: '2021-06', url: 'https://example.com/c' },
    ]);
  });

  // `issuingOrg` is the deprecated read-view alias for `authority`. Records
  // indexed before the rename still carry only the alias.
  it('falls back to the deprecated issuingOrg alias', () => {
    const r = profileToJsonResume({
      ...minimal,
      certifications: [{ rkey: '1', name: 'Cert', issuingOrg: 'Legacy issuer' }],
    });
    expect(r.certificates?.[0]?.issuer).toBe('Legacy issuer');
  });
});

describe('profileToJsonResume skills, languages, projects, publications, volunteer', () => {
  // Sifa stores one record per skill; JSON Resume groups skills. Emitting one
  // entry per skill keeps export and import symmetric, which is what makes a
  // round-trip through a third-party editor safe.
  it('emits one entry per skill', () => {
    const r = profileToJsonResume({
      ...minimal,
      skills: [
        { rkey: '1', name: 'TypeScript', category: 'engineering' },
        { rkey: '2', name: 'Facilitation' },
      ],
    });
    expect(r.skills).toEqual([{ name: 'TypeScript' }, { name: 'Facilitation' }]);
  });

  it('maps languages with a human-readable fluency', () => {
    const r = profileToJsonResume({
      ...minimal,
      languages: [
        { rkey: '1', language: 'Dutch', proficiency: 'native' },
        { rkey: '2', language: 'German', proficiency: 'limited_working' },
        { rkey: '3', language: 'Latin' },
      ],
    });
    expect(r.languages).toEqual([
      { language: 'Dutch', fluency: 'Native or bilingual' },
      { language: 'German', fluency: 'Limited working' },
      { language: 'Latin' },
    ]);
  });

  it('maps projects', () => {
    const r = profileToJsonResume({
      ...minimal,
      projects: [
        {
          rkey: '1',
          name: 'Sifa',
          description: 'A network.',
          url: 'https://sifa.id',
          startDate: '2026-03',
        },
      ],
    });
    expect(r.projects).toEqual([
      { name: 'Sifa', description: 'A network.', url: 'https://sifa.id', startDate: '2026-03' },
    ]);
  });

  it('maps publications', () => {
    const r = profileToJsonResume({
      ...minimal,
      publications: [
        {
          rkey: '1',
          title: 'A paper',
          publisher: 'A journal',
          date: '2019-05-01T00:00:00.000Z',
          url: 'https://doi.org/x',
        },
      ],
    });
    expect(r.publications).toEqual([
      {
        name: 'A paper',
        publisher: 'A journal',
        releaseDate: '2019-05-01',
        url: 'https://doi.org/x',
      },
    ]);
  });

  it('maps volunteering', () => {
    const r = profileToJsonResume({
      ...minimal,
      volunteering: [
        {
          rkey: '1',
          organization: 'A charity',
          role: 'Board member',
          startDate: '2018',
          description: 'Governance.',
        },
      ],
    });
    expect(r.volunteer).toEqual([
      {
        organization: 'A charity',
        position: 'Board member',
        startDate: '2018',
        summary: 'Governance.',
      },
    ]);
  });
});

describe('profileToJsonResume meta and shape', () => {
  it('records the canonical profile URL and the schema version', () => {
    const r = profileToJsonResume(minimal);
    expect(r.meta?.canonical).toBe('https://sifa.id/p/gui.do');
    expect(r.meta?.version).toBe('v1.0.0');
  });

  it('emits no empty arrays for a profile with nothing filled in', () => {
    const r = profileToJsonResume(minimal);
    for (const [key, value] of Object.entries(r)) {
      expect(Array.isArray(value) && value.length === 0, `${key} is an empty array`).toBe(false);
    }
  });

  it('applies the sanitizer to user-authored text', () => {
    const r = profileToJsonResume(
      { ...minimal, about: '<script>x</script>bio' },
      { sanitize: (s) => s.replace(/<[^>]*>/g, '') },
    );
    expect(r.basics?.summary).toBe('xbio');
  });

  it('is JSON-serialisable without undefined leaking into the output', () => {
    const r = profileToJsonResume({ ...minimal, headline: 'x' });
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});
