import { describe, expect, it } from 'vitest';

import {
  EMPTY_SITE_ACTIVITY_PRESET,
  SITE_PRESET_MAX_TAGS,
  isSiteActivityPresetActive,
  matchesSiteActivityPreset,
  matchesSitePresetTags,
  normalizeSitePresetTag,
  parseSitePresetTags,
  recordTags,
  siteActivityPresetSchema,
  siteActivityPresetUpdateSchema,
} from './site-activity-preset.js';

describe('normalizeSitePresetTag', () => {
  it('lowercases, trims and strips a leading hash', () => {
    expect(normalizeSitePresetTag('  #Research ')).toBe('research');
  });

  it('collapses inner whitespace', () => {
    expect(normalizeSitePresetTag('open   science')).toBe('open science');
  });

  it('rejects empty and over-long tags', () => {
    expect(normalizeSitePresetTag('  # ')).toBeNull();
    expect(normalizeSitePresetTag('a'.repeat(65))).toBeNull();
  });
});

describe('parseSitePresetTags', () => {
  it('splits a comma-separated string, normalizes and dedupes', () => {
    expect(parseSitePresetTags('Research, #research,  neuroscience,,')).toEqual([
      'research',
      'neuroscience',
    ]);
  });

  it('accepts an array and splits newlines too', () => {
    expect(parseSitePresetTags(['ml\nAI', 'ml'])).toEqual(['ml', 'ai']);
  });

  it('caps the list', () => {
    const many = Array.from({ length: 40 }, (_, i) => `t${i}`).join(',');
    expect(parseSitePresetTags(many)).toHaveLength(SITE_PRESET_MAX_TAGS);
  });
});

describe('isSiteActivityPresetActive', () => {
  it('is false for the empty preset', () => {
    expect(isSiteActivityPresetActive(EMPTY_SITE_ACTIVITY_PRESET)).toBe(false);
  });

  it('is true when either list is non-empty', () => {
    expect(isSiteActivityPresetActive({ categories: ['Research'], tags: [] })).toBe(true);
    expect(isSiteActivityPresetActive({ categories: [], tags: ['ml'] })).toBe(true);
  });
});

describe('recordTags', () => {
  it('reads normalized string tags off a record', () => {
    expect(recordTags({ tags: ['#ML', 3, '', 'Open Science'] })).toEqual(['ml', 'open science']);
  });

  it('returns [] for records without tags', () => {
    expect(recordTags({ title: 'x' })).toEqual([]);
    expect(recordTags(null)).toEqual([]);
  });
});

describe('matchesSitePresetTags', () => {
  const tagged = { category: 'Articles', record: { tags: ['Research'] } };
  const untagged = { category: 'Articles', record: { title: 'Holiday' } };
  const post = { category: 'Posts', record: { text: 'hi' } };

  it('keeps everything when no tags are set', () => {
    expect(matchesSitePresetTags(untagged, [])).toBe(true);
  });

  it('keeps long-form items that carry a chosen tag, case-insensitively', () => {
    expect(matchesSitePresetTags(tagged, ['research'])).toBe(true);
  });

  it('drops long-form items without a chosen tag', () => {
    expect(matchesSitePresetTags(tagged, ['cooking'])).toBe(false);
    expect(matchesSitePresetTags(untagged, ['research'])).toBe(false);
  });

  it('never filters items outside long-form posts on tags', () => {
    expect(matchesSitePresetTags(post, ['research'])).toBe(true);
  });
});

describe('matchesSiteActivityPreset', () => {
  it('passes everything through the empty preset', () => {
    expect(
      matchesSiteActivityPreset({ category: 'Music', record: {} }, EMPTY_SITE_ACTIVITY_PRESET),
    ).toBe(true);
  });

  it('applies the category allow-list and the tag filter together', () => {
    const preset = { categories: ['Articles', 'Research'], tags: ['research'] };
    expect(matchesSiteActivityPreset({ category: 'Music', record: {} }, preset)).toBe(false);
    expect(matchesSiteActivityPreset({ category: 'Research', record: {} }, preset)).toBe(true);
    expect(
      matchesSiteActivityPreset({ category: 'Articles', record: { tags: ['Research'] } }, preset),
    ).toBe(true);
    expect(
      matchesSiteActivityPreset({ category: 'Articles', record: { tags: ['travel'] } }, preset),
    ).toBe(false);
  });
});

describe('siteActivityPresetSchema', () => {
  it('parses a preset response', () => {
    expect(siteActivityPresetSchema.parse({ categories: ['Research'], tags: ['ml'] })).toEqual({
      categories: ['Research'],
      tags: ['ml'],
    });
  });
});

describe('siteActivityPresetUpdateSchema', () => {
  it('accepts known categories and normalizes tags', () => {
    expect(
      siteActivityPresetUpdateSchema.parse({ categories: ['Research'], tags: ['#ML', 'ml'] }),
    ).toEqual({ categories: ['Research'], tags: ['ml'] });
  });

  it('rejects unknown categories', () => {
    expect(
      siteActivityPresetUpdateSchema.safeParse({ categories: ['Nope'], tags: [] }).success,
    ).toBe(false);
  });

  it('dedupes categories', () => {
    expect(
      siteActivityPresetUpdateSchema.parse({ categories: ['Research', 'Research'], tags: [] }),
    ).toEqual({ categories: ['Research'], tags: [] });
  });
});
