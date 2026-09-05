import { describe, it, expect } from 'vitest';
import {
  buildProfileHighlights,
  shouldRenderHighlights,
  formatSpanDate,
  formatSingleDate,
  formatEventDate,
  type ProfileHighlightsInput,
} from './highlights.js';

// A fixed "today" so upcoming/latest decisions are deterministic.
const TODAY = '2026-09-04';

function profile(partial: Partial<ProfileHighlightsInput>): ProfileHighlightsInput {
  return { did: 'did:plc:me', handle: 'me.example', ...partial } as ProfileHighlightsInput;
}

describe('date formatters', () => {
  it('formats an ongoing span as "Since <month year>"', () => {
    expect(formatSpanDate('2014-01', undefined)).toBe('Since Jan 2014');
  });

  it('formats a closed span with an en dash', () => {
    expect(formatSpanDate('2023-11', '2026-01')).toBe('Nov 2023 – Jan 2026');
  });

  it('collapses an equal start/end span to a single month', () => {
    expect(formatSpanDate('2023-06', '2023-06')).toBe('Jun 2023');
  });

  it('returns a single month when only an end is known', () => {
    expect(formatSpanDate(undefined, '2023-06')).toBe('Jun 2023');
  });

  it('returns undefined when no dates are known', () => {
    expect(formatSpanDate(undefined, undefined)).toBeUndefined();
  });

  it('formats a single publication month', () => {
    expect(formatSingleDate('2026-07')).toBe('Jul 2026');
  });

  it('formats a day-level event date', () => {
    expect(formatEventDate('2026-10-12')).toBe('Oct 12, 2026');
  });

  it('falls back to month/year for a month-only event date', () => {
    expect(formatEventDate('2026-10')).toBe('Oct 2026');
  });
});

describe('buildProfileHighlights - career (always shown)', () => {
  it('picks the ongoing position and marks it current', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        positions: [
          { rkey: 'a', title: 'Old', company: 'A', startedAt: '2010-01', endedAt: '2015-01' },
          { rkey: 'b', title: 'Now', entityName: 'Bcorp', startedAt: '2020-01' },
        ],
      }),
      { today: TODAY },
    );
    const career = row2.find((t) => t.section === 'career');
    expect(career).toMatchObject({
      section: 'career',
      href: '#career',
      title: 'Now',
      meta: 'Bcorp',
      status: 'current',
      dateStr: 'Since Jan 2020',
    });
  });

  it('falls back to the most-recent ended position when nothing is ongoing', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        positions: [
          { rkey: 'a', title: 'First', company: 'A', startedAt: '2010-01', endedAt: '2015-01' },
          { rkey: 'b', title: 'Last', company: 'B', startedAt: '2016-01', endedAt: '2020-01' },
        ],
      }),
      { today: TODAY },
    );
    const career = row2.find((t) => t.section === 'career');
    expect(career).toMatchObject({
      title: 'Last',
      status: 'recent',
      dateStr: 'Jan 2016 – Jan 2020',
    });
  });
});

describe('buildProfileHighlights - education with course fallback', () => {
  it('uses the most-recent education record', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        education: [
          {
            rkey: 'e',
            institution: 'Uni',
            degree: 'BSc',
            startedAt: '2005-09',
            endedAt: '2009-06',
          },
        ],
        courses: [{ rkey: 'c', name: 'Course', institution: 'Growth Tribe' }],
      }),
      { today: TODAY },
    );
    const edu = row2.find((t) => t.section === 'education');
    expect(edu).toMatchObject({ href: '#education', title: 'BSc', status: 'recent' });
  });

  it('falls back to a course (no date) when there is no education', () => {
    const { row2 } = buildProfileHighlights(
      profile({ courses: [{ rkey: 'c', name: 'AI for Business', institution: 'Growth Tribe' }] }),
      { today: TODAY },
    );
    const edu = row2.find((t) => t.section === 'education');
    expect(edu).toMatchObject({
      href: '#courses',
      title: 'AI for Business',
      meta: 'Growth Tribe',
    });
    expect(edu?.dateStr).toBeUndefined();
  });
});

describe('buildProfileHighlights - project & involvement (only when ongoing)', () => {
  it('shows a project only when one is ongoing', () => {
    const ended = buildProfileHighlights(
      profile({
        projects: [{ rkey: 'p', name: 'Done', startDate: '2018-01', endDate: '2022-01' }],
      }),
      { today: TODAY },
    );
    expect(ended.row2.find((t) => t.section === 'project')).toBeUndefined();

    const ongoing = buildProfileHighlights(
      profile({ projects: [{ rkey: 'p', name: 'Live', startDate: '2024-01' }] }),
      { today: TODAY },
    );
    expect(ongoing.row2.find((t) => t.section === 'project')).toMatchObject({
      title: 'Live',
      status: 'current',
      dateStr: 'Since Jan 2024',
      href: '#projects',
    });
  });

  it('shows involvement only when ongoing, using role + upstream', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        involvement: [
          {
            rkey: 'i',
            kind: 'charity',
            role: 'Donor / Supporter',
            upstream: 'Bits of Freedom',
            startedAt: '2014-01',
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row2.find((t) => t.section === 'involvement')).toMatchObject({
      title: 'Donor / Supporter',
      meta: 'Bits of Freedom',
      status: 'current',
      dateStr: 'Since Jan 2014',
      href: '#involvement',
    });
  });
});

describe('buildProfileHighlights - talk & publication (row 1)', () => {
  it('marks a future talk upcoming and a past talk latest, with day-level date', () => {
    const upcoming = buildProfileHighlights(
      profile({
        presentations: [
          {
            rkey: 't',
            title: 'ATScience afternoon',
            coverImageUrl: 'https://img.example/cover.jpg',
            deliveries: [
              {
                rkey: 'd',
                eventName: 'IOSP 2026',
                location: 'Leiden, NL',
                role: 'id.sifa.defs#roleHost',
                mode: 'community.lexicon.calendar.event#inperson',
                date: '2026-10-12',
              },
            ],
          },
        ],
      }),
      { today: TODAY },
    );
    const talk = upcoming.row1.find((t) => t.section === 'talk');
    expect(talk).toMatchObject({
      section: 'talk',
      href: '#presentations',
      title: 'ATScience afternoon',
      status: 'upcoming',
      dateStr: 'Oct 12, 2026',
      imageUrl: 'https://img.example/cover.jpg',
    });
    expect(talk?.meta).toContain('IOSP 2026');
    expect(talk?.meta).toContain('Leiden, NL');

    const past = buildProfileHighlights(
      profile({
        presentations: [
          {
            rkey: 't',
            title: 'Old talk',
            deliveries: [{ rkey: 'd', eventName: 'DevConf', date: '2024-05-01' }],
          },
        ],
      }),
      { today: TODAY },
    );
    expect(past.row1.find((t) => t.section === 'talk')?.status).toBe('recent');
  });

  it('picks the latest publication and carries its image', () => {
    const { row1 } = buildProfileHighlights(
      profile({
        publications: [
          { rkey: 'p1', title: 'Older', date: '2025-01', verified: false },
          {
            rkey: 'p2',
            title: "Your identity isn't your username",
            publicationName: 'gui.do',
            subtitle: 'AT Protocol series, part 2',
            date: '2026-07',
            image: 'https://img.example/hero.jpg',
            verified: false,
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row1.find((t) => t.section === 'publication')).toMatchObject({
      title: "Your identity isn't your username",
      meta: 'gui.do · AT Protocol series, part 2',
      status: 'recent',
      dateStr: 'Jul 2026',
      imageUrl: 'https://img.example/hero.jpg',
      href: '#publications',
    });
  });
});

describe('buildProfileHighlights - omission', () => {
  it('returns empty rows for an empty profile', () => {
    const { row1, row2 } = buildProfileHighlights(profile({}), { today: TODAY });
    expect(row1).toHaveLength(0);
    expect(row2).toHaveLength(0);
  });

  it('orders row2 as career, education, project, involvement', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        involvement: [
          { rkey: 'i', kind: 'charity', role: 'R', upstream: 'O', startedAt: '2014-01' },
        ],
        positions: [{ rkey: 'a', title: 'Job', company: 'A', startedAt: '2020-01' }],
        projects: [{ rkey: 'p', name: 'Live', startDate: '2024-01' }],
        education: [
          {
            rkey: 'e',
            institution: 'Uni',
            degree: 'BSc',
            startedAt: '2005-09',
            endedAt: '2009-06',
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row2.map((t) => t.section)).toEqual(['career', 'education', 'project', 'involvement']);
  });
});

describe('buildProfileHighlights - co-people (exclude owner, name others)', () => {
  it('names co-authors on a publication and omits the owner', () => {
    const { row1 } = buildProfileHighlights(
      profile({
        publications: [
          {
            rkey: 'p',
            title: 'Paper',
            date: '2026-01',
            verified: false,
            contributors: [
              { name: 'Me', did: 'did:plc:me' },
              { name: 'Jane Doe', did: 'did:plc:jane' },
              { name: 'Alex Roe' },
            ],
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row1.find((t) => t.section === 'publication')?.meta).toBe('with Jane Doe, Alex Roe');
  });

  it('shows no author when the owner is the only contributor, keeping a third-party venue', () => {
    const { row1 } = buildProfileHighlights(
      profile({
        publications: [
          {
            rkey: 'p',
            title: 'Solo',
            publicationName: 'Journal X',
            date: '2026-01',
            verified: false,
            contributors: [{ name: 'Me', handle: 'me.example' }],
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row1.find((t) => t.section === 'publication')?.meta).toBe('Journal X');
  });

  it("drops the venue when it is the owner's own handle", () => {
    const { row1 } = buildProfileHighlights(
      profile({
        publications: [
          {
            rkey: 'p',
            title: 'Post',
            publicationName: 'me.example',
            date: '2026-01',
            verified: false,
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row1.find((t) => t.section === 'publication')?.meta).toBeUndefined();
  });

  it("drops the venue when it is the owner's display name (self-published)", () => {
    const { row1 } = buildProfileHighlights(
      profile({
        displayName: 'Me Person',
        publications: [
          { rkey: 'p', title: 'Post', publisher: 'Me Person', date: '2026-01', verified: false },
        ],
      }),
      { today: TODAY },
    );
    expect(row1.find((t) => t.section === 'publication')?.meta).toBeUndefined();
  });

  it('keeps a display-name-matching venue when there are co-authors (avoids a journal collision)', () => {
    const { row1 } = buildProfileHighlights(
      profile({
        displayName: 'Nature',
        publications: [
          {
            rkey: 'p',
            title: 'A paper',
            publisher: 'Nature',
            date: '2026-01',
            verified: false,
            contributors: [
              { name: 'Nature', did: 'did:plc:me' },
              { name: 'Jane Doe', did: 'did:plc:jane' },
            ],
          },
        ],
      }),
      { today: TODAY },
    );
    const meta = row1.find((t) => t.section === 'publication')?.meta;
    expect(meta).toContain('with Jane Doe');
    expect(meta).toContain('Nature'); // venue kept: co-authored, likely a real journal
  });

  it('names project members other than the owner', () => {
    const { row2 } = buildProfileHighlights(
      profile({
        projects: [
          {
            rkey: 'p',
            name: 'CRO.CAFE',
            startDate: '2024-01',
            members: [
              { did: 'did:plc:me', handle: 'me.example' },
              { did: 'did:plc:jane', handle: 'jane.example', displayName: 'Jane Doe' },
            ],
          },
        ],
      }),
      { today: TODAY },
    );
    expect(row2.find((t) => t.section === 'project')?.meta).toBe('with Jane Doe');
  });
});

describe('shouldRenderHighlights - collapse threshold', () => {
  it('renders when there are two or more tiles', () => {
    const rows = buildProfileHighlights(
      profile({
        positions: [{ rkey: 'a', title: 'Job', company: 'A', startedAt: '2020-01' }],
        education: [
          {
            rkey: 'e',
            institution: 'Uni',
            degree: 'BSc',
            startedAt: '2005-09',
            endedAt: '2009-06',
          },
        ],
      }),
      { today: TODAY },
    );
    expect(shouldRenderHighlights(rows)).toBe(true);
  });

  it('omits under two tiles (a lone tile just duplicates the section below)', () => {
    const one = buildProfileHighlights(
      profile({ positions: [{ rkey: 'a', title: 'Job', company: 'A', startedAt: '2020-01' }] }),
      { today: TODAY },
    );
    expect(one.row1.length + one.row2.length).toBe(1);
    expect(shouldRenderHighlights(one)).toBe(false);

    expect(shouldRenderHighlights(buildProfileHighlights(profile({}), { today: TODAY }))).toBe(
      false,
    );
  });
});
