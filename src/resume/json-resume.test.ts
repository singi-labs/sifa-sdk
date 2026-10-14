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
  it('never emits email or phone unless the caller passes them', () => {
    const r = profileToJsonResume(minimal);
    expect(r.basics && 'email' in r.basics).toBe(false);
    expect(r.basics && 'phone' in r.basics).toBe(false);
    expect(r.basics?.location && 'address' in r.basics.location).toBeFalsy();
  });

  // The owner types these on the export page; they live in the browser only.
  it('emits contact details passed in by the caller', () => {
    const r = profileToJsonResume(
      { ...minimal, location: { country: 'Netherlands', city: 'Amsterdam', countryCode: 'NL' } },
      { contact: { email: 'a@b.co', phone: '+31 6 1', address: 'Main Street 1\n1234 AB' } },
    );
    expect(r.basics?.email).toBe('a@b.co');
    expect(r.basics?.phone).toBe('+31 6 1');
    expect(r.basics?.location).toEqual({
      address: 'Main Street 1\n1234 AB',
      city: 'Amsterdam',
      countryCode: 'NL',
    });
  });

  it('emits an address even when the profile has no location', () => {
    const r = profileToJsonResume(minimal, { contact: { address: 'Main Street 1' } });
    expect(r.basics?.location).toEqual({ address: 'Main Street 1' });
  });

  it('normalises contact details before use', () => {
    const r = profileToJsonResume(minimal, {
      contact: { email: ' a@b.co ', phone: ' ', address: 'Street 1\r\n\r\nCity' },
    });
    expect(r.basics?.email).toBe('a@b.co');
    expect(r.basics && 'phone' in r.basics).toBe(false);
    expect(r.basics?.location?.address).toBe('Street 1\nCity');
  });

  // JSON Resume has no field for these, and strict consumers (altacv, the
  // docs.sifa.id Typst starter) refuse the whole file on an unknown key.
  it('never emits personal details, which JSON Resume has no field for', () => {
    const r = profileToJsonResume(minimal, {
      contact: {
        email: 'a@b.co',
        driversLicense: 'B',
        rightToWork: 'EU citizen',
        nationality: 'Dutch',
      },
    });
    expect(r.basics?.email).toBe('a@b.co');
    expect(r.basics).not.toHaveProperty('driversLicense');
    expect(r.basics).not.toHaveProperty('rightToWork');
    expect(r.basics).not.toHaveProperty('nationality');
    expect(JSON.stringify(r)).not.toContain('Dutch');
  });

  it('emits no personal details by default', () => {
    const r = profileToJsonResume(minimal);
    expect(r.basics).not.toHaveProperty('nationality');
    expect(r.basics).not.toHaveProperty('driversLicense');
    expect(r.basics).not.toHaveProperty('rightToWork');
  });

  it('runs contact details through the sanitizer', () => {
    const r = profileToJsonResume(minimal, {
      contact: { email: 'a@b.co' },
      sanitize: (v) => v.toUpperCase(),
    });
    expect(r.basics?.email).toBe('A@B.CO');
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

describe('profileToJsonResume never emits blanks', () => {
  // A record whose only name is whitespace should lose the key, not carry an
  // empty string: a CV template renders `organization: ''` as a blank line
  // under the entry, which reads as a rendering bug to whoever receives it.
  it('omits volunteer.organization rather than emitting an empty string', () => {
    const r = profileToJsonResume({
      ...minimal,
      volunteering: [{ rkey: '1', organization: '   ', role: 'Board member' }],
    });
    expect(r.volunteer?.[0]).toEqual({ position: 'Board member' });
  });

  it('omits education.institution rather than emitting an empty string', () => {
    const r = profileToJsonResume({
      ...minimal,
      education: [{ rkey: '1', institution: '', degree: 'MSc' }],
    });
    expect(r.education?.[0]).toEqual({ studyType: 'MSc' });
  });

  it('routes the avatar and external account URLs through the sanitizer', () => {
    const r = profileToJsonResume(
      {
        ...minimal,
        avatar: 'https://cdn.example/a.jpg',
        externalAccounts: [
          {
            rkey: '1',
            platform: 'github',
            url: 'https://github.com/gxjansen',
            verifiable: true,
            verified: true,
          },
        ],
      },
      { sanitize: (value) => `[${value}]` },
    );
    expect(r.basics?.image).toBe('[https://cdn.example/a.jpg]');
    expect(r.basics?.profiles?.[0]?.url).toBe('[https://github.com/gxjansen]');
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

  // The transform here is deliberately meaningless. The emitter's contract is
  // that it routes user-authored text through the caller's sanitizer; the real
  // sanitizer is DOMPurify on the consuming side, and a tag-stripping regex
  // standing in for it here would only be a worse one.
  it('applies the sanitizer to user-authored text', () => {
    const r = profileToJsonResume(
      { ...minimal, about: 'bio', headline: 'title' },
      { sanitize: (value) => `[${value}]` },
    );
    expect(r.basics?.summary).toBe('[bio]');
    expect(r.basics?.label).toBe('[title]');
  });

  it('is JSON-serialisable without undefined leaking into the output', () => {
    const r = profileToJsonResume({ ...minimal, headline: 'x' });
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});

// The profile API sends the primary location in `locations[]` (and a display
// string in `location`), not the structured object, so the resume had none.
describe('profileToJsonResume location from locations[]', () => {
  it('maps the primary location entry', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      location: 'Amsterdam, North Holland, Netherlands',
      locations: [
        {
          rkey: 'x',
          type: 'id.sifa.defs#locationSecondary',
          isPrimary: false,
          locationLocality: 'Berlin',
          countryCode: 'DE',
        },
        {
          rkey: 'y',
          type: 'id.sifa.defs#locationPrimary',
          isPrimary: true,
          locationCountry: 'Netherlands',
          locationRegion: 'North Holland',
          locationLocality: 'Amsterdam',
          countryCode: 'NL',
        },
      ],
    });
    expect(r.basics?.location).toEqual({
      city: 'Amsterdam',
      region: 'North Holland',
      countryCode: 'NL',
    });
  });

  it('keeps the address next to the primary location', () => {
    const r = profileToJsonResume(
      {
        handle: 'gui.do',
        locations: [
          {
            rkey: 'y',
            type: 'p',
            isPrimary: true,
            locationLocality: 'Amsterdam',
            countryCode: 'NL',
          },
        ],
      },
      { contact: { address: 'Keizersgracht 1' } },
    );
    expect(r.basics?.location).toEqual({
      address: 'Keizersgracht 1',
      city: 'Amsterdam',
      countryCode: 'NL',
    });
  });

  it('prefers a structured location object when there is one', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      location: { country: 'Netherlands', city: 'Utrecht', countryCode: 'NL' },
      locations: [{ rkey: 'y', type: 'p', isPrimary: true, locationLocality: 'Amsterdam' }],
    });
    expect(r.basics?.location?.city).toBe('Utrecht');
  });
});

// The profile page, Markdown, DOCX and print sort these lists newest first;
// the JSON Resume (and the typeset PDF built from it) kept record order.
describe('profileToJsonResume ordering', () => {
  it('lists work newest first', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      positions: [
        { rkey: '1', company: 'A', title: 'Old', startedAt: '1995-01', endedAt: '2000-01' },
        { rkey: '2', company: 'B', title: 'Newest', startedAt: '2020-01' },
        { rkey: '3', company: 'C', title: 'Middle', startedAt: '2006-09', endedAt: '2007-09' },
      ],
    });
    expect(r.work?.map((w) => w.position)).toEqual(['Newest', 'Middle', 'Old']);
  });

  it('lists education newest first', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      education: [
        { rkey: '1', institution: 'School', startedAt: '1995', endedAt: '2001' },
        { rkey: '2', institution: 'University', startedAt: '2001', endedAt: '2007' },
      ],
    });
    expect(r.education?.map((e) => e.institution)).toEqual(['University', 'School']);
  });

  it('lists publications newest first', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      publications: [
        { rkey: '1', title: 'Older', date: '2010' },
        { rkey: '2', title: 'Newer', date: '2020' },
      ],
    });
    expect(r.publications?.map((p) => p.name)).toEqual(['Newer', 'Older']);
  });
});

describe('profileToJsonResume location fallbacks', () => {
  it('uses the first entry when none is marked primary', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      locations: [
        {
          rkey: 'y',
          type: 'p',
          isPrimary: false,
          locationLocality: 'Amsterdam',
          countryCode: 'NL',
        },
      ],
    });
    expect(r.basics?.location).toEqual({ city: 'Amsterdam', countryCode: 'NL' });
  });

  it('parses a display-string location when there is no locations array', () => {
    const r = profileToJsonResume({ handle: 'gui.do', location: 'Utrecht, Utrecht, Netherlands' });
    expect(r.basics?.location).toEqual({ city: 'Utrecht', region: 'Utrecht' });
  });

  it('falls through an empty structured location to locations', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      location: { country: '' },
      locations: [{ rkey: 'y', type: 'p', isPrimary: true, locationLocality: 'Amsterdam' }],
    });
    expect(r.basics?.location).toEqual({ city: 'Amsterdam' });
  });

  it('reads the legacy city when the locality is blank', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      locations: [
        { rkey: 'y', type: 'p', isPrimary: true, locationLocality: '', locationCity: 'Amsterdam' },
      ],
    });
    expect(r.basics?.location).toEqual({ city: 'Amsterdam' });
  });
});

describe('profileToJsonResume volunteering order', () => {
  it('lists volunteering current first, then newest', () => {
    const r = profileToJsonResume({
      handle: 'gui.do',
      volunteering: [
        { rkey: '1', organization: 'Old', role: 'A', startDate: '2010-01', endDate: '2012-01' },
        { rkey: '2', organization: 'Current', role: 'B', startDate: '2022-01' },
        { rkey: '3', organization: 'Middle', role: 'C', startDate: '2015-01', endDate: '2016-01' },
      ],
    });
    expect(r.volunteer?.map((v) => v.organization)).toEqual(['Current', 'Middle', 'Old']);
  });
});

// altacv refuses a resume whose link fields are not URIs, so a website typed
// as "example.com" used to fail the whole typeset PDF.
describe('profileToJsonResume links', () => {
  const r = profileToJsonResume({
    handle: 'x.example',
    website: 'example.com',
    externalAccounts: [
      { rkey: '1', platform: 'github', url: 'github.com/x' },
      { rkey: '2', platform: 'other', url: 'not a link' },
    ],
    publications: [{ rkey: 'p', title: 'T', url: 'https://doi.org/10.1/x' }],
  } as never);

  it('adds https:// to a bare domain', () => {
    expect(r.basics?.url).toBe('https://example.com');
    expect(r.basics?.profiles?.[0]?.url).toBe('https://github.com/x');
  });

  it('keeps a full URL as it is', () => {
    expect(r.publications?.[0]?.url).toBe('https://doi.org/10.1/x');
  });

  it('leaves out a value that is not a link', () => {
    expect(r.basics?.profiles?.[1]).not.toHaveProperty('url');
  });
});
