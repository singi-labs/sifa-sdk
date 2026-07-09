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
});
