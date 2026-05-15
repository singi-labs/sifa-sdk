import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './format-time.js';
import { sanitizeHandleInput } from './handle-utils.js';
import { countryCodeToFlag, formatLocation, parseLocationString } from './location-utils.js';
import {
  detectPdsProvider,
  getDisplayLabel,
  getHandleStem,
  getPdsDisplayName,
  pdsProviderFromApi,
} from './pds-utils.js';
import {
  certDateExtractor,
  dateRangeExtractor,
  lexiconDateExtractor,
  singleDateExtractor,
  sortByDateDesc,
} from './sort-by-date.js';
import { truncateGraphemes } from './text-truncate.js';
import { formatDistanceToNow } from './time-utils.js';
import {
  contrastRatio,
  isValidRgbColor,
  meetsContrastAA,
  relativeLuminance,
  rgbToString,
} from './wcag-contrast.js';

describe('formatRelativeTime', () => {
  it('returns "" for invalid dates', () => {
    expect(formatRelativeTime('not a date')).toBe('');
  });

  it('returns "" for future dates', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(formatRelativeTime(future)).toBe('');
  });

  it('formats minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(past)).toBe('5m ago');
  });

  it('formats years ago', () => {
    const past = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(past)).toBe('2y ago');
  });
});

describe('formatDistanceToNow', () => {
  it('returns "just now" for very recent dates', () => {
    expect(formatDistanceToNow(new Date())).toBe('just now');
  });

  it('formats weeks ago (this flavor has a weeks bucket)', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(formatDistanceToNow(past)).toBe('1w ago');
  });
});

describe('truncateGraphemes', () => {
  it('returns the input when under the limit', () => {
    expect(truncateGraphemes('hello', 10)).toBe('hello');
  });

  it('appends an ellipsis when truncating', () => {
    expect(truncateGraphemes('hello world', 8)).toBe('hello w…');
  });

  it('returns empty string for maxLen <= 0', () => {
    expect(truncateGraphemes('hello', 0)).toBe('');
  });

  it('returns just the ellipsis when maxLen is 1', () => {
    expect(truncateGraphemes('hello', 1)).toBe('…');
  });

  it('does not split emoji sequences', () => {
    const flag = '🇳🇱'; // NL flag (2 code units, 1 grapheme)
    // With maxLen=2 and input "🇳🇱NL" (3 graphemes), keep the flag + add ellipsis
    expect(truncateGraphemes(flag + 'NL', 2)).toBe(flag + '…');
  });
});

describe('sortByDateDesc', () => {
  it('places ongoing items first', () => {
    const items = [
      { id: 'past', startDate: '2020', endDate: '2022' },
      { id: 'current', startDate: '2024', current: true },
      { id: 'older', startDate: '2018', endDate: '2019' },
    ];
    const sorted = sortByDateDesc(items, dateRangeExtractor);
    expect(sorted.map((i) => i.id)).toEqual(['current', 'past', 'older']);
  });

  it('places items without dates at the bottom', () => {
    const items = [{ id: 'undated' }, { id: 'dated', startDate: '2020', endDate: '2022' }];
    const sorted = sortByDateDesc(items, dateRangeExtractor);
    expect(sorted[0]?.id).toBe('dated');
  });

  it('lexiconDateExtractor maps startedAt/endedAt with current derived from !endedAt', () => {
    const position = { startedAt: '2024', endedAt: undefined };
    expect(lexiconDateExtractor(position)).toEqual({
      startDate: '2024',
      endDate: undefined,
      current: true,
    });
  });

  it('certDateExtractor falls back end date to issue date', () => {
    expect(certDateExtractor({ issueDate: '2024-06' })).toEqual({
      startDate: '2024-06',
      endDate: '2024-06',
    });
  });

  it('singleDateExtractor uses date as endDate', () => {
    expect(singleDateExtractor({ date: '2024' })).toEqual({ endDate: '2024' });
  });
});

describe('formatLocation', () => {
  it('joins city, region, country', () => {
    expect(formatLocation({ city: 'Amsterdam', region: 'NH', country: 'NL' })).toBe(
      'Amsterdam, NH, NL',
    );
  });

  it('prefers locality over the legacy city slot', () => {
    expect(
      formatLocation({ city: 'Old', locality: 'Amsterdam', region: 'NH', country: 'NL' }),
    ).toBe('Amsterdam, NH, NL');
  });

  it('falls back to city when locality is missing', () => {
    expect(formatLocation({ city: 'Amsterdam', country: 'NL' })).toBe('Amsterdam, NL');
  });

  it('uses postal code when both locality and city are missing', () => {
    expect(formatLocation({ postalCode: '1011', country: 'NL' })).toBe('1011, NL');
  });

  it('returns "" for null/undefined', () => {
    expect(formatLocation(null)).toBe('');
    expect(formatLocation(undefined)).toBe('');
  });
});

describe('parseLocationString', () => {
  it('parses a 3-part location string', () => {
    expect(parseLocationString('Amsterdam, NH, NL')).toEqual({
      city: 'Amsterdam',
      region: 'NH',
      country: 'NL',
    });
  });

  it('parses a 2-part location string', () => {
    expect(parseLocationString('Amsterdam, NL')).toEqual({
      city: 'Amsterdam',
      country: 'NL',
    });
  });

  it('returns null for empty input', () => {
    expect(parseLocationString('   ')).toBeNull();
  });
});

describe('countryCodeToFlag', () => {
  it('converts NL to the Dutch flag emoji', () => {
    expect(countryCodeToFlag('NL')).toBe('🇳🇱');
  });

  it('returns "" for invalid input', () => {
    expect(countryCodeToFlag('XYZ')).toBe('');
    expect(countryCodeToFlag(undefined)).toBe('');
  });
});

describe('sanitizeHandleInput', () => {
  it('strips bsky.app profile URL prefix', () => {
    expect(sanitizeHandleInput('https://bsky.app/profile/alice.bsky.social')).toBe(
      'alice.bsky.social',
    );
  });

  it('strips at:// prefix', () => {
    expect(sanitizeHandleInput('at://alice.bsky.social')).toBe('alice.bsky.social');
  });

  it('strips leading @', () => {
    expect(sanitizeHandleInput('@alice.bsky.social')).toBe('alice.bsky.social');
  });

  it('appends .bsky.social to a bare username', () => {
    expect(sanitizeHandleInput('alice')).toBe('alice.bsky.social');
  });

  it('preserves DIDs', () => {
    expect(sanitizeHandleInput('did:plc:abcdef')).toBe('did:plc:abcdef');
  });
});

describe('pds-utils', () => {
  it('getHandleStem strips known PDS suffixes', () => {
    expect(getHandleStem('alice.bsky.social')).toBe('alice');
    expect(getHandleStem('alice.eurosky.social')).toBe('alice');
    expect(getHandleStem('alice.example.com')).toBe('alice.example.com');
  });

  it('detectPdsProvider identifies bluesky from suffix', () => {
    expect(detectPdsProvider('alice.bsky.social')?.name).toBe('bluesky');
    expect(detectPdsProvider('alice.example.com')).toBeNull();
  });

  it('pdsProviderFromApi handles icon-only providers', () => {
    expect(pdsProviderFromApi({ name: 'selfhosted', host: 'pds.example.com' }, 'alice')).toEqual({
      name: 'selfhosted',
      profileUrl: '',
      host: 'pds.example.com',
    });
  });

  it('pdsProviderFromApi rejects unknown providers', () => {
    expect(pdsProviderFromApi({ name: 'unknown', host: 'x.com' }, 'alice')).toBeNull();
  });

  it('getDisplayLabel prefers displayName, falls back to handle stem', () => {
    expect(getDisplayLabel('Alice', 'alice.bsky.social')).toBe('Alice');
    expect(getDisplayLabel(undefined, 'alice.bsky.social')).toBe('alice');
  });

  it('getPdsDisplayName has friendly names', () => {
    expect(getPdsDisplayName('bluesky')).toBe('Bluesky');
    expect(getPdsDisplayName('northsky')).toBe('NorthSky');
    expect(getPdsDisplayName('whatever')).toBe('whatever');
  });
});

describe('wcag-contrast', () => {
  it('isValidRgbColor rejects out-of-range channels', () => {
    expect(isValidRgbColor({ r: 0, g: 0, b: 0 })).toBe(true);
    expect(isValidRgbColor({ r: 256, g: 0, b: 0 })).toBe(false);
    expect(isValidRgbColor({ r: -1, g: 0, b: 0 })).toBe(false);
    expect(isValidRgbColor(null)).toBe(false);
  });

  it('rgbToString floors sub-pixel values', () => {
    expect(rgbToString({ r: 100.7, g: 50.3, b: 25.9 })).toBe('rgb(100, 50, 25)');
  });

  it('relativeLuminance of pure white is 1, black is 0', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('contrastRatio of black on white is 21', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('meetsContrastAA requires 4.5:1', () => {
    expect(meetsContrastAA({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(true);
    expect(meetsContrastAA({ r: 128, g: 128, b: 128 }, { r: 200, g: 200, b: 200 })).toBe(false);
  });
});
