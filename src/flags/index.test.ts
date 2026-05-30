import { describe, expect, it } from 'vitest';

import { getFlagSvg, listSupportedCountryCodes } from './index.js';

describe('flags subpath', () => {
  it('exposes a large catalog of ISO-3166 alpha-2 codes', () => {
    const codes = listSupportedCountryCodes();
    // Twemoji ships flags for ~250+ regional indicator pairs.
    expect(codes.length).toBeGreaterThanOrEqual(250);
  });

  it('returns lowercase, sorted codes from listSupportedCountryCodes', () => {
    const codes = listSupportedCountryCodes();
    const sorted = [...codes].sort();
    expect(codes).toEqual(sorted);
    for (const code of codes) {
      expect(code).toBe(code.toLowerCase());
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });

  it('includes well-known country codes', () => {
    const codes = new Set(listSupportedCountryCodes());
    for (const cc of ['nl', 'us', 'jp', 'de', 'fr', 'gb', 'br', 'cn']) {
      expect(codes.has(cc)).toBe(true);
    }
  });

  it('looks up flags case-insensitively', () => {
    const upper = getFlagSvg('NL');
    const lower = getFlagSvg('nl');
    expect(upper).not.toBeNull();
    expect(lower).not.toBeNull();
    expect(upper).toBe(lower);
  });

  it('returns null for unknown codes', () => {
    expect(getFlagSvg('xx')).toBeNull();
    expect(getFlagSvg('')).toBeNull();
    expect(getFlagSvg('zzz')).toBeNull();
  });

  it('returns SVG content that contains a viewBox and parses as XML', () => {
    const svg = getFlagSvg('nl');
    expect(svg).not.toBeNull();
    expect(svg).toContain('viewBox');
    expect(svg).toMatch(/^<svg[\s>]/);
    expect(svg).toContain('</svg>');
  });

  it('matches snapshot for NL flag', () => {
    expect(getFlagSvg('nl')).toMatchSnapshot();
  });

  it('matches snapshot for JP flag', () => {
    expect(getFlagSvg('jp')).toMatchSnapshot();
  });
});
