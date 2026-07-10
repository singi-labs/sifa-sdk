import { describe, it, expect } from 'vitest';
import { classifyEntityRef, isLinked } from './entity-ref-anchor.js';

describe('classifyEntityRef', () => {
  it('classifies a registry-backed ref (Wikidata / ROR / GLEIF) as registry', () => {
    expect(classifyEntityRef('http://www.wikidata.org/entity/Q42')).toBe('registry');
    expect(classifyEntityRef('https://ror.org/05dxps055')).toBe('registry');
    expect(classifyEntityRef('https://www.gleif.org/lei/5493001KJTIIGC8Y1R12')).toBe('registry');
  });

  it('classifies a Sifa-scoped ref as sifa', () => {
    expect(classifyEntityRef('https://sifa.id/company/abc123')).toBe('sifa');
  });

  it('classifies a missing or empty ref as unlinked', () => {
    expect(classifyEntityRef(null)).toBe('unlinked');
    expect(classifyEntityRef(undefined)).toBe('unlinked');
    expect(classifyEntityRef('')).toBe('unlinked');
    expect(classifyEntityRef('   ')).toBe('unlinked');
  });

  it('treats a malformed URL or unknown host as unlinked (no false linked state)', () => {
    expect(classifyEntityRef('not a url')).toBe('unlinked');
    expect(classifyEntityRef('https://evil.com/?x=wikidata.org/entity/Q1')).toBe('unlinked');
    expect(classifyEntityRef('https://example.com/company/x')).toBe('unlinked');
  });
});

describe('isLinked', () => {
  it('is true for any real anchor and false for unlinked', () => {
    expect(isLinked('https://sifa.id/company/abc')).toBe(true);
    expect(isLinked('http://www.wikidata.org/entity/Q42')).toBe(true);
    expect(isLinked(null)).toBe(false);
    expect(isLinked('free text company')).toBe(false);
  });
});
