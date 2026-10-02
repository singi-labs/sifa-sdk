import { describe, expect, it } from 'vitest';

import {
  FUNDER_CV_GROUPS,
  defaultFunderCvSelection,
  findUnknownFunderCvItems,
  funderCvItemId,
  funderCvSelectionSchema,
  listFunderCvCandidates,
  profileToFunderCv,
  type FunderCvProfileInput,
} from './funder-cv.js';

const pub = (rkey: string, date?: string, extra: Record<string, unknown> = {}) => ({
  rkey,
  title: `Paper ${rkey}`,
  date,
  ...extra,
});

const PROFILE: FunderCvProfileInput = {
  handle: 'ada.example.com',
  givenName: 'Ada',
  familyName: 'Lovelace',
  displayName: 'Ada L.',
  headline: 'Researcher',
  website: 'https://ada.example.com',
  positions: [
    {
      rkey: 'p1',
      title: 'Postdoc',
      company: 'Old Lab',
      startedAt: '2016-09',
      endedAt: '2019-08',
    },
    {
      rkey: 'p2',
      title: 'Associate Professor',
      company: 'Stored Name',
      entityName: 'University of Example',
      startedAt: '2019-09-01T00:00:00.000Z',
      location: { locality: 'Utrecht', country: 'Netherlands', countryCode: 'NL' },
    },
    { rkey: 'p3', title: 'Secret role', company: 'X', startedAt: '2020', hidden: true },
  ],
  education: [
    {
      rkey: 'e1',
      institution: 'College',
      degree: 'BSc',
      fieldOfStudy: 'Mathematics',
      startedAt: '2008',
      endedAt: '2011-06',
    },
    {
      rkey: 'e2',
      institution: 'Stored U',
      entityName: 'University of Example',
      degree: 'PhD',
      fieldOfStudy: 'Computing',
      startedAt: '2012-09',
      endedAt: '2016-06-30',
    },
  ],
  publications: [
    pub('a', '2018-01'),
    pub('b', '2024-03-01', {
      contributors: [{ name: 'Ada Lovelace' }, { name: 'Charles Babbage' }],
      publisher: 'Journal of Engines',
      doi: '10.1234/engines.1',
    }),
    pub('c', '2020'),
    pub('d'),
    pub('e', '2022-07'),
    pub('f', '2019'),
    pub('g', '2021'),
    pub('h', '2023'),
    pub('i', '2017'),
    pub('j', '2016'),
    pub('k', '2015'),
    pub('hidden', '2025', { hidden: true }),
  ],
  presentations: [
    {
      rkey: 't1',
      title: 'Keynote on engines',
      deliveries: [
        { rkey: 'd1', eventName: 'EngineConf', date: '2023-05-04', location: 'Paris' },
        { rkey: 'd2', eventName: 'Later Conf', date: '2025-02' },
      ],
    },
    { rkey: 't2', title: 'Hidden talk', hidden: true },
  ],
  honors: [
    { rkey: 'h1', title: 'Best Paper', issuer: 'ACM', date: '2021-06' },
    { rkey: 'h2', title: 'Fellowship', entityName: 'Royal Society', date: '2024' },
  ],
  courses: [
    {
      rkey: 'c1',
      name: 'Intro to Engines',
      institution: 'University of Example',
      role: 'id.sifa.defs#courseTaught',
      startedAt: '2020-09',
    },
    { rkey: 'c2', name: 'A course I took', role: 'id.sifa.defs#courseTaken' },
  ],
  volunteering: [
    { rkey: 'v1', organization: 'Open Science NL', role: 'Board member', startDate: '2021' },
  ],
  externalAccounts: [
    {
      rkey: 'x1',
      platform: 'orcid',
      url: 'https://orcid.org/0000-0002-1825-0097',
      verifiable: true,
      verified: true,
    },
  ],
};

describe('funderCvItemId', () => {
  it('joins kind and rkey', () => {
    expect(funderCvItemId('publication', '3kabc')).toBe('publication:3kabc');
  });
});

describe('listFunderCvCandidates', () => {
  it('lists visible items of the asked kinds, most recent first, undated last', () => {
    const ids = listFunderCvCandidates(PROFILE, ['publication']).map((c) => c.id);
    expect(ids.slice(0, 3)).toEqual(['publication:b', 'publication:h', 'publication:e']);
    expect(ids.at(-1)).toBe('publication:d');
    expect(ids).not.toContain('publication:hidden');
  });

  it('dates a talk by its latest delivery', () => {
    const [talk] = listFunderCvCandidates(PROFILE, ['presentation']);
    expect(talk).toMatchObject({ id: 'presentation:t1', kind: 'presentation', date: '2025-02' });
  });

  it('returns nothing for a profile without records', () => {
    expect(listFunderCvCandidates({ handle: 'x' }, ['publication', 'honor'])).toEqual([]);
  });
});

describe('defaultFunderCvSelection', () => {
  it('NIH: five most recent publications as related, the next five as other', () => {
    const sel = defaultFunderCvSelection(PROFILE, 'nih');
    expect(sel.format).toBe('nih');
    if (sel.format !== 'nih') return;
    expect(sel.related).toEqual([
      'publication:b',
      'publication:h',
      'publication:e',
      'publication:g',
      'publication:c',
    ]);
    expect(sel.other).toEqual([
      'publication:f',
      'publication:a',
      'publication:i',
      'publication:j',
      'publication:k',
    ]);
    expect(sel.honors).toEqual(['honor:h2', 'honor:h1']);
  });

  it('ERC: ten most recent publications, honors as recognition', () => {
    const sel = defaultFunderCvSelection(PROFILE, 'erc');
    if (sel.format !== 'erc') throw new Error('wrong format');
    expect(sel.outputs).toHaveLength(FUNDER_CV_GROUPS.erc.outputs.max);
    expect(sel.outputs[0]).toBe('publication:b');
    expect(sel.recognition).toEqual(['honor:h2', 'honor:h1']);
  });

  it('is empty for an empty profile', () => {
    expect(defaultFunderCvSelection({ handle: 'x' }, 'nih')).toEqual({
      format: 'nih',
      related: [],
      other: [],
      honors: [],
    });
  });
});

describe('funderCvSelectionSchema', () => {
  it('accepts a selection inside the limits', () => {
    const parsed = funderCvSelectionSchema.safeParse({
      format: 'nih',
      related: ['publication:a'],
      other: ['presentation:t1'],
      honors: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('defaults missing groups to empty lists', () => {
    const parsed = funderCvSelectionSchema.parse({ format: 'erc' });
    expect(parsed).toEqual({ format: 'erc', outputs: [], recognition: [] });
  });

  it('rejects more items than the funder allows', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((r) => `publication:${r}`);
    expect(funderCvSelectionSchema.safeParse({ format: 'nih', related: six }).success).toBe(false);
    const eleven = Array.from({ length: 11 }, (_, i) => `publication:p${i}`);
    expect(funderCvSelectionSchema.safeParse({ format: 'erc', outputs: eleven }).success).toBe(
      false,
    );
  });

  it('rejects an item kind the group does not take', () => {
    expect(
      funderCvSelectionSchema.safeParse({ format: 'erc', outputs: ['honor:h1'] }).success,
    ).toBe(false);
  });

  it('rejects malformed ids', () => {
    for (const id of ['publication:', 'nonsense:a', 'publication:a/b', 'at://x']) {
      expect(funderCvSelectionSchema.safeParse({ format: 'erc', outputs: [id] }).success).toBe(
        false,
      );
    }
  });

  it('rejects one product listed both as related and as other', () => {
    const parsed = funderCvSelectionSchema.safeParse({
      format: 'nih',
      related: ['publication:a'],
      other: ['publication:a'],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an unknown format', () => {
    expect(funderCvSelectionSchema.safeParse({ format: 'nwo' }).success).toBe(false);
  });
});

describe('findUnknownFunderCvItems', () => {
  it('returns ids that are not visible records of the profile', () => {
    const unknown = findUnknownFunderCvItems(PROFILE, {
      format: 'nih',
      related: ['publication:b', 'publication:nope', 'publication:hidden'],
      other: ['presentation:t2'],
      honors: ['honor:h1'],
    });
    expect(unknown).toEqual(['publication:nope', 'publication:hidden', 'presentation:t2']);
  });

  it('returns nothing for a valid selection', () => {
    expect(findUnknownFunderCvItems(PROFILE, defaultFunderCvSelection(PROFILE, 'erc'))).toEqual([]);
  });
});

describe('profileToFunderCv: NIH', () => {
  const doc = profileToFunderCv(PROFILE, {
    format: 'nih',
    related: ['publication:b', 'presentation:t1'],
    other: ['publication:a'],
    honors: ['honor:h1'],
  });
  if (doc.format !== 'nih') throw new Error('wrong format');

  it('fills identifying information, preferring the structured name', () => {
    expect(doc.person).toMatchObject({
      name: 'Ada Lovelace',
      familyName: 'Lovelace',
      givenName: 'Ada',
      orcid: '0000-0002-1825-0097',
    });
    expect(doc.positionTitle).toBe('Associate Professor');
    expect(doc.organization).toBe('University of Example');
    expect(doc.location).toBe('Utrecht, Netherlands');
  });

  it('lists professional preparation newest first with MM/YYYY receipt dates', () => {
    expect(doc.education).toEqual([
      {
        organization: 'University of Example',
        degree: 'PhD',
        start: '09/2012',
        end: '06/2016',
        field: 'Computing',
      },
      {
        organization: 'College',
        degree: 'BSc',
        start: '2008',
        end: '06/2011',
        field: 'Mathematics',
      },
    ]);
  });

  it('lists appointments newest first, leaving hidden ones out', () => {
    expect(doc.appointments.map((a) => a.title)).toEqual(['Associate Professor', 'Postdoc']);
    expect(doc.appointments[0]).toMatchObject({ start: '2019', end: null });
    expect(doc.appointments[1]).toMatchObject({ start: '2016', end: '2019' });
  });

  it('keeps the selected products in the order picked', () => {
    expect(doc.products.related.map((p) => p.title)).toEqual(['Paper b', 'Keynote on engines']);
    expect(doc.products.related[0]).toMatchObject({
      authors: 'Ada Lovelace, Charles Babbage',
      venue: 'Journal of Engines',
      date: '2024',
      doi: '10.1234/engines.1',
    });
    expect(doc.products.related[1]).toMatchObject({
      kind: 'presentation',
      authors: 'Ada Lovelace',
      venue: 'Later Conf',
      date: '2025',
    });
    expect(doc.products.other.map((p) => p.title)).toEqual(['Paper a']);
  });

  it('maps honors to year, title and organization', () => {
    expect(doc.honors).toEqual([{ year: '2021', title: 'Best Paper', organization: 'ACM' }]);
  });

  it('leaves the sections Sifa has no records for as empty placeholders', () => {
    expect(doc.personalStatement).toBeNull();
    expect(doc.contributions).toEqual([]);
  });
});

describe('profileToFunderCv: ERC', () => {
  const doc = profileToFunderCv(PROFILE, {
    format: 'erc',
    outputs: ['publication:b'],
    recognition: ['honor:h2', 'presentation:t1'],
  });
  if (doc.format !== 'erc') throw new Error('wrong format');

  it('splits current and previous positions', () => {
    expect(doc.currentPositions.map((p) => p.title)).toEqual(['Associate Professor']);
    expect(doc.previousPositions.map((p) => p.title)).toEqual(['Postdoc']);
  });

  it('lists education with the receipt date', () => {
    expect(doc.education[0]).toMatchObject({ date: '06/2016', degree: 'PhD' });
  });

  it('carries outputs and peer recognition in the order picked', () => {
    expect(doc.outputs.map((o) => o.title)).toEqual(['Paper b']);
    expect(doc.recognition).toEqual([
      { kind: 'honor', year: '2024', title: 'Fellowship', organization: 'Royal Society' },
      {
        kind: 'presentation',
        year: '2025',
        title: 'Keynote on engines',
        organization: 'Later Conf',
      },
    ]);
  });

  it('lists teaching and service as contributions to the research community', () => {
    expect(doc.communityContributions).toEqual([
      {
        kind: 'teaching',
        start: '2020',
        end: null,
        title: 'Intro to Engines',
        organization: 'University of Example',
      },
      {
        kind: 'service',
        start: '2021',
        end: null,
        title: 'Board member',
        organization: 'Open Science NL',
      },
    ]);
  });

  it('carries the identifier and website', () => {
    expect(doc.person.orcid).toBe('0000-0002-1825-0097');
    expect(doc.person.website).toBe('https://ada.example.com');
  });

  it('leaves the sections Sifa has no records for as placeholders', () => {
    expect(doc.acronym).toBeNull();
    expect(doc.careerBreaks).toBeNull();
  });
});

describe('profileToFunderCv: empty profile', () => {
  it('renders a document with every list empty', () => {
    const doc = profileToFunderCv(
      { handle: 'empty.example.com' },
      { format: 'erc', outputs: [], recognition: [] },
    );
    expect(doc).toMatchObject({
      format: 'erc',
      person: { name: 'empty.example.com' },
      education: [],
      currentPositions: [],
      previousPositions: [],
      outputs: [],
      recognition: [],
      communityContributions: [],
    });
  });

  it('drops ids it cannot find instead of failing', () => {
    const doc = profileToFunderCv(
      { handle: 'x' },
      { format: 'nih', related: ['publication:gone'], other: [], honors: [] },
    );
    if (doc.format !== 'nih') throw new Error('wrong format');
    expect(doc.products.related).toEqual([]);
  });
});
