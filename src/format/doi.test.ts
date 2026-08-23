import { describe, expect, it } from 'vitest';
import { normalizeDoi } from './doi.js';

describe('normalizeDoi', () => {
  // The bare form is the point: inside a URL a DOI is a link, bare it is an
  // identifier two records can be matched on.
  it('leaves a bare DOI alone', () => {
    expect(normalizeDoi('10.1234/example')).toBe('10.1234/example');
  });

  it('strips the doi.org resolver', () => {
    expect(normalizeDoi('https://doi.org/10.1234/example')).toBe('10.1234/example');
  });

  it('strips the legacy dx.doi.org resolver', () => {
    expect(normalizeDoi('http://dx.doi.org/10.1234/example')).toBe('10.1234/example');
  });

  it('strips the doi: scheme used in citations', () => {
    expect(normalizeDoi('doi:10.1234/example')).toBe('10.1234/example');
    expect(normalizeDoi('DOI: 10.1234/example')).toBe('10.1234/example');
  });

  it('strips a resolver carrying the scheme as well', () => {
    expect(normalizeDoi('https://doi.org/doi:10.1234/example')).toBe('10.1234/example');
  });

  it('is case insensitive on the resolver host', () => {
    expect(normalizeDoi('HTTPS://DOI.ORG/10.1234/example')).toBe('10.1234/example');
  });

  it('trims surrounding whitespace from a paste', () => {
    expect(normalizeDoi('  10.1234/example\n')).toBe('10.1234/example');
  });

  it('keeps the case of the suffix', () => {
    // DOI suffixes are case insensitive for resolution but not for display, and
    // publishers mint mixed-case ones. Lowercasing would rewrite the identifier.
    expect(normalizeDoi('https://doi.org/10.1234/AbC.2026')).toBe('10.1234/AbC.2026');
  });

  it('passes through something that is not a DOI', () => {
    // A normalizer, not a validator. Rejecting here would fail a whole write
    // over a field nothing depends on.
    expect(normalizeDoi('not a doi')).toBe('not a doi');
  });

  it('is idempotent', () => {
    const once = normalizeDoi('https://doi.org/10.1234/example');
    expect(normalizeDoi(once)).toBe(once);
  });
});
