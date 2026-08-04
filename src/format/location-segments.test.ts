import { describe, it, expect } from 'vitest';
import { locationSegments } from './location-segments.js';

describe('locationSegments', () => {
  it('returns locality, region and country in reading order', () => {
    expect(
      locationSegments({ locality: 'Amsterdam', region: 'North Holland', country: 'Netherlands' }),
    ).toEqual([
      { kind: 'locality', label: 'Amsterdam', searchHref: null },
      { kind: 'region', label: 'North Holland', searchHref: null },
      { kind: 'country', label: 'Netherlands', searchHref: '/search?country=Netherlands' },
    ]);
  });

  it('drops a segment that repeats its neighbour', () => {
    // "Oslo, Oslo, Norway" -- city and region collide in capital regions.
    expect(locationSegments({ locality: 'Oslo', region: 'Oslo', country: 'Norway' })).toEqual([
      { kind: 'locality', label: 'Oslo', searchHref: null },
      { kind: 'country', label: 'Norway', searchHref: '/search?country=Norway' },
    ]);
  });

  it('ignores case and surrounding space when comparing neighbours', () => {
    expect(locationSegments({ locality: 'Oslo', region: ' oslo ', country: 'Norway' })).toEqual([
      { kind: 'locality', label: 'Oslo', searchHref: null },
      { kind: 'country', label: 'Norway', searchHref: '/search?country=Norway' },
    ]);
  });

  it('drops empty and whitespace-only segments', () => {
    expect(locationSegments({ locality: 'Berlin', region: '   ', country: 'Germany' })).toEqual([
      { kind: 'locality', label: 'Berlin', searchHref: null },
      { kind: 'country', label: 'Germany', searchHref: '/search?country=Germany' },
    ]);
  });

  it('falls back to the legacy city field when locality is absent', () => {
    expect(locationSegments({ city: 'Lisbon', country: 'Portugal' })).toEqual([
      { kind: 'locality', label: 'Lisbon', searchHref: null },
      { kind: 'country', label: 'Portugal', searchHref: '/search?country=Portugal' },
    ]);
  });

  it('prefers locality over the legacy city field', () => {
    expect(locationSegments({ city: 'Old', locality: 'Lisbon', country: 'Portugal' })).toEqual([
      { kind: 'locality', label: 'Lisbon', searchHref: null },
      { kind: 'country', label: 'Portugal', searchHref: '/search?country=Portugal' },
    ]);
  });

  it('percent-encodes a country name with spaces', () => {
    const [country] = locationSegments({ country: 'United Kingdom' });
    expect(country).toEqual({
      kind: 'country',
      label: 'United Kingdom',
      searchHref: '/search?country=United+Kingdom',
    });
  });

  it('does not link a country that is not searchable', () => {
    // LinkedIn imports leave metro areas in the country field. Linking one
    // promises a result set that does not exist.
    expect(locationSegments({ country: 'Greater Bielefeld Area' }, { searchable: false })).toEqual([
      { kind: 'country', label: 'Greater Bielefeld Area', searchHref: null },
    ]);
  });

  it('returns an empty list for a missing location', () => {
    expect(locationSegments(null)).toEqual([]);
    expect(locationSegments(undefined)).toEqual([]);
  });

  it('returns an empty list when every segment is blank', () => {
    expect(locationSegments({ country: '  ' })).toEqual([]);
  });

  it('handles a country-only location', () => {
    expect(locationSegments({ country: 'Norway' })).toEqual([
      { kind: 'country', label: 'Norway', searchHref: '/search?country=Norway' },
    ]);
  });

  it('never produces two adjacent segments with the same label', () => {
    const cases = [
      { locality: 'Oslo', region: 'Oslo', country: 'Norway' },
      { locality: 'Singapore', region: 'Singapore', country: 'Singapore' },
      { locality: 'Berlin', region: 'Berlin', country: 'Germany' },
    ];
    for (const loc of cases) {
      const labels = locationSegments(loc).map((s) => s.label.toLowerCase());
      for (let i = 1; i < labels.length; i++) {
        expect(labels[i]).not.toBe(labels[i - 1]);
      }
    }
  });
});
