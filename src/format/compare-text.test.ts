import { afterEach, describe, it, expect, vi } from 'vitest';
import { compareText } from './compare-text.js';
import { groupSkillsByCategory, groupSkillsBySubCategory } from '../taxonomy/skill-grouping.js';
import { sortLanguagesByProficiency } from '../profile/language-sort.js';

// The server renders with one default locale and the visitor's browser with
// another. Any name sort that follows the runtime's default collation then
// orders differently on each side, and React rejects the hydration. Simulate
// a Ukrainian browser by making locale-less `localeCompare` calls collate as
// `uk`, which puts Cyrillic before Latin (English puts Latin first).
function simulateUkrainianDefaultLocale() {
  const collate = (a: string, b: string, locales: Intl.LocalesArgument, o?: Intl.CollatorOptions) =>
    new Intl.Collator(locales, o).compare(a, b);
  vi.spyOn(String.prototype, 'localeCompare').mockImplementation(function (
    this: string,
    that: string,
    locales?: Intl.LocalesArgument,
    options?: Intl.CollatorOptions,
  ) {
    return collate(this, that, locales ?? 'uk', options);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('compareText', () => {
  it('collates with a fixed locale, independent of the runtime default', () => {
    simulateUkrainianDefaultLocale();
    expect(['Тестування', 'API Testing'].sort(compareText)).toEqual(['API Testing', 'Тестування']);
  });
});

describe('name sorts are locale-independent', () => {
  const skills = [
    { rkey: '1', name: 'Тестування', category: 'technical' },
    { rkey: '2', name: 'API Testing', category: 'technical' },
  ];

  it('groupSkillsByCategory', () => {
    simulateUkrainianDefaultLocale();
    const grouped = groupSkillsByCategory(skills as never) as [string, { name: string }[]][];
    expect(grouped[0]![1].map((s) => s.name)).toEqual(['API Testing', 'Тестування']);
  });

  it('groupSkillsBySubCategory (skills and group labels)', () => {
    simulateUkrainianDefaultLocale();
    const grouped = groupSkillsBySubCategory([
      { rkey: '1', name: 'Тестування', subCategory: 'Якість' },
      { rkey: '2', name: 'API Testing', subCategory: 'Automation' },
      { rkey: '3', name: 'Ручне', subCategory: 'Automation' },
    ] as never);
    expect(grouped.map(([label]) => label)).toEqual(['Automation', 'Якість']);
    expect((grouped[0]![1] as { name: string }[]).map((s) => s.name)).toEqual([
      'API Testing',
      'Ручне',
    ]);
  });

  it('sortLanguagesByProficiency', () => {
    simulateUkrainianDefaultLocale();
    const sorted = sortLanguagesByProficiency([
      { language: 'Українська', proficiency: 'native' },
      { language: 'English', proficiency: 'native' },
    ]);
    expect(sorted.map((l) => l.language)).toEqual(['English', 'Українська']);
  });
});
