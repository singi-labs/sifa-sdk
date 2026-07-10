import { describe, it, expect } from 'vitest';
import { normalizeCompanyKey } from './normalize-company-key.js';

describe('normalizeCompanyKey', () => {
  it('collapses casing and accent variants of the same name to one key', () => {
    const nestle = normalizeCompanyKey('Nestlé');
    expect(normalizeCompanyKey('Nestle')).toBe(nestle);
    expect(normalizeCompanyKey('NESTLE')).toBe(nestle);
    expect(normalizeCompanyKey('nestle')).toBe(nestle);
  });

  it('folds diacritics predictably', () => {
    expect(normalizeCompanyKey('Åkander')).toBe('akander');
  });

  it('NFC-normalizes composed vs decomposed input to the same key', () => {
    const composed = 'é'; // é, single codepoint
    const decomposed = 'é'; // e + combining acute accent
    expect(normalizeCompanyKey(`Caf${composed}`)).toBe(normalizeCompanyKey(`Caf${decomposed}`));
  });

  it('is case-insensitive for ASCII names', () => {
    expect(normalizeCompanyKey('Spryker')).toBe('spryker');
    expect(normalizeCompanyKey('SPRYKER')).toBe('spryker');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeCompanyKey('  Acme Corp  ')).toBe('acme corp');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeCompanyKey('')).toBe('');
    expect(normalizeCompanyKey('   ')).toBe('');
  });

  it('does not strip non-Latin scripts (no Latin diacritics to fold)', () => {
    expect(normalizeCompanyKey('Сбербанк')).toBe('сбербанк');
  });
});
