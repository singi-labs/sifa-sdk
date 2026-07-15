import { describe, it, expect } from 'vitest';
import { sortLanguagesByProficiency } from './language-sort.js';

type Lang = { rkey: string; language: string; proficiency?: string };

function lang(rkey: string, language: string, proficiency?: string): Lang {
  return { rkey, language, proficiency };
}

describe('sortLanguagesByProficiency', () => {
  it('orders native > full_professional > professional_working > limited_working > elementary', () => {
    const sorted = sortLanguagesByProficiency([
      lang('e', 'Spanish', 'elementary'),
      lang('n', 'Dutch', 'native'),
      lang('l', 'German', 'limited_working'),
      lang('f', 'English', 'full_professional'),
      lang('p', 'French', 'professional_working'),
    ]);
    expect(sorted.map((l) => l.rkey)).toEqual(['n', 'f', 'p', 'l', 'e']);
  });

  it('breaks ties alphabetically by language name', () => {
    const sorted = sortLanguagesByProficiency([
      lang('a', 'Swahili', 'native'),
      lang('b', 'Dutch', 'native'),
      lang('c', 'English', 'native'),
    ]);
    expect(sorted.map((l) => l.language)).toEqual(['Dutch', 'English', 'Swahili']);
  });

  it('sinks items with no proficiency to the bottom', () => {
    const sorted = sortLanguagesByProficiency([
      lang('a', 'Klingon'),
      lang('b', 'Dutch', 'elementary'),
    ]);
    expect(sorted.map((l) => l.rkey)).toEqual(['b', 'a']);
  });

  it('treats unknown proficiency strings as no proficiency', () => {
    const sorted = sortLanguagesByProficiency([
      lang('a', 'Klingon', 'fluent-ish'),
      lang('b', 'Dutch', 'elementary'),
    ]);
    expect(sorted.map((l) => l.rkey)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const input = [lang('a', 'Spanish', 'elementary'), lang('b', 'Dutch', 'native')];
    const snapshot = input.map((l) => l.rkey);
    sortLanguagesByProficiency(input);
    expect(input.map((l) => l.rkey)).toEqual(snapshot);
  });

  it('returns an empty array unchanged', () => {
    expect(sortLanguagesByProficiency([])).toEqual([]);
  });
});
