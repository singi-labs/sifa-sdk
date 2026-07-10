import { describe, it, expect } from 'vitest';
import { formatCompanyName } from './company-name.js';

describe('formatCompanyName', () => {
  it('title-cases an all-lowercase single word', () => {
    expect(formatCompanyName('spryker')).toBe('Spryker');
  });

  it('title-cases multi-word names, lowercasing interior connectors', () => {
    expect(formatCompanyName('spryker systems gmbh')).toBe('Spryker Systems Gmbh');
    expect(formatCompanyName('bank of the west')).toBe('Bank of the West');
    expect(formatCompanyName('de bijenkorf')).toBe('De Bijenkorf'); // leading connector still capitalized
  });

  it('leaves already-cased names untouched (ROR / Wikidata are correct)', () => {
    expect(formatCompanyName('University of Testing')).toBe('University of Testing');
    expect(formatCompanyName('IBM')).toBe('IBM');
    expect(formatCompanyName('Google (United States)')).toBe('Google (United States)');
  });

  it('handles digits and punctuation without crashing', () => {
    expect(formatCompanyName('go 2 automotive')).toBe('Go 2 Automotive');
    expect(formatCompanyName('123 industries')).toBe('123 Industries');
  });

  it('trims and preserves interior spacing shape', () => {
    expect(formatCompanyName('  acme corp  ')).toBe('Acme Corp');
  });

  it('returns empty/blank input unchanged', () => {
    expect(formatCompanyName('')).toBe('');
    expect(formatCompanyName('   ')).toBe('');
  });

  it('leaves names with any non-ASCII letter unchanged (Turkish dotted/dotless i)', () => {
    // Locale-dependent casing (Turkish İ/i, ı/I) is exactly the pitfall this
    // scoping avoids -- bail whenever a non-ASCII letter is present.
    expect(formatCompanyName('iş bankası')).toBe('iş bankası');
    expect(formatCompanyName('İş Bankası')).toBe('İş Bankası');
  });

  it('leaves Cyrillic names unchanged', () => {
    expect(formatCompanyName('сбербанк')).toBe('сбербанк');
  });

  it('leaves CJK names unchanged', () => {
    expect(formatCompanyName('株式会社')).toBe('株式会社');
  });

  it('leaves accented Latin names unchanged', () => {
    expect(formatCompanyName('société générale')).toBe('société générale');
  });

  it('still title-cases pure ASCII-Latin all-lowercase names', () => {
    expect(formatCompanyName('spryker')).toBe('Spryker');
  });

  it('KNOWN LIMITATION: all-lowercase ASCII wordmarks are still title-cased', () => {
    // "adidas" and "thyssenkrupp" are intentional-lowercase ASCII wordmarks.
    // ASCII-Latin scoping (this change) only bails on non-ASCII letters, so it
    // cannot distinguish these from a PDL-lowercased name like "spryker" ->
    // "Spryker" (which we DO want title-cased). Documented here as current
    // behavior, not a regression: see decision D8 / sifa-workspace#235.
    // A fix (curated lowercase-wordmark allowlist, or dropping
    // auto-capitalization entirely) is a separate product decision.
    expect(formatCompanyName('adidas')).toBe('Adidas');
    expect(formatCompanyName('thyssenkrupp')).toBe('Thyssenkrupp');
  });
});
