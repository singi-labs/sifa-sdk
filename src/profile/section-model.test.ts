import { describe, it, expect } from 'vitest';
import type { Profile } from '../types/index.js';
import {
  ALL_SECTIONS,
  SECTION_GROUPS,
  SECTION_LABELS,
  filterHidden,
  getVisibleSectionIds,
  isSectionPopulated,
  visibleItems,
} from './section-model.js';

function profile(overrides: Partial<Profile>): Profile {
  return {
    positions: [],
    education: [],
    skills: [],
    ...overrides,
  } as Profile;
}

describe('ALL_SECTIONS order (evidence-first)', () => {
  const ids: string[] = ALL_SECTIONS.map((s) => s.id);

  it('matches the agreed evidence-first order', () => {
    expect(ids).toEqual([
      'about',
      'career',
      'skills',
      'projects',
      'presentations',
      'publications',
      'credentials',
      'education',
      'courses',
      'awards',
      'involvement',
      'languages',
      'other-profiles',
    ]);
  });

  it('places Skills right after Career', () => {
    expect(ids.indexOf('skills')).toBe(ids.indexOf('career') + 1);
  });

  it('places the show-your-work block (projects, talks, publications) above the formal block', () => {
    expect(ids.indexOf('projects')).toBeLessThan(ids.indexOf('credentials'));
    expect(ids.indexOf('presentations')).toBeLessThan(ids.indexOf('publications'));
    expect(ids.indexOf('publications')).toBeLessThan(ids.indexOf('credentials'));
  });

  it('demotes Courses below Projects, Talks, and Publications', () => {
    for (const earlier of ['projects', 'presentations', 'publications', 'education']) {
      expect(ids.indexOf('courses')).toBeGreaterThan(ids.indexOf(earlier));
    }
  });
});

describe('section groups', () => {
  it('every section maps to a known group', () => {
    const groupIds = new Set(SECTION_GROUPS.map((g) => g.id));
    for (const sec of ALL_SECTIONS) {
      expect(groupIds.has(sec.group)).toBe(true);
    }
  });

  it('each group occupies a contiguous run in section order', () => {
    const order = ALL_SECTIONS.map((s) => s.group);
    const runs = order.filter((g, i) => i === 0 || g !== order[i - 1]);
    expect(runs.length).toBe(new Set(order).size);
  });
});

describe('SECTION_LABELS', () => {
  it('has an English label for every section id', () => {
    for (const { id } of ALL_SECTIONS) {
      expect(SECTION_LABELS[id]).toBeTruthy();
    }
  });

  it('renders other-profiles as "Links"', () => {
    expect(SECTION_LABELS['other-profiles']).toBe('Links');
  });
});

describe('isSectionPopulated: presentations', () => {
  it('is populated when there are presentations', () => {
    expect(
      isSectionPopulated(profile({ presentations: [{ rkey: 'p1' }] as never }), 'presentations'),
    ).toBe(true);
  });

  it('is populated when there are only standalone deliveries', () => {
    expect(
      isSectionPopulated(
        profile({ presentationDeliveries: [{ rkey: 'd1' }] as never }),
        'presentations',
      ),
    ).toBe(true);
  });

  it('is not populated when both are empty', () => {
    expect(
      isSectionPopulated(
        profile({ presentations: [], presentationDeliveries: [] }),
        'presentations',
      ),
    ).toBe(false);
  });

  it('is false for an unknown section id', () => {
    expect(isSectionPopulated(profile({}), 'nope')).toBe(false);
  });
});

describe('getVisibleSectionIds', () => {
  it('owners see every section regardless of content', () => {
    const ids = getVisibleSectionIds(profile({}), true);
    expect(ids).toEqual(ALL_SECTIONS.map((s) => s.id));
  });

  it('visitors only see populated sections', () => {
    const p = profile({ positions: [{ rkey: 'x' }] as never, about: 'hi', headline: 'eng' });
    const ids = getVisibleSectionIds(p, false);
    expect(ids).toContain('about');
    expect(ids).toContain('career');
    expect(ids).not.toContain('education');
  });
});

describe('filterHidden / visibleItems', () => {
  const items = [{ rkey: 'a' }, { rkey: 'b', hidden: true }, { rkey: 'c' }];

  it('filterHidden drops hidden items', () => {
    expect(filterHidden(items).map((i) => i.rkey)).toEqual(['a', 'c']);
  });

  it('filterHidden tolerates undefined', () => {
    expect(filterHidden(undefined)).toEqual([]);
  });

  it('visibleItems keeps hidden items for the owner', () => {
    expect(visibleItems(items, true).map((i) => i.rkey)).toEqual(['a', 'b', 'c']);
  });

  it('visibleItems drops hidden items for a visitor', () => {
    expect(visibleItems(items, false).map((i) => i.rkey)).toEqual(['a', 'c']);
  });
});
