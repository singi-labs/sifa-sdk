import { describe, it, expect } from 'vitest';
import { buildTalkSlug, parseTalkRkey, slugifyTitle } from './talk-slug.js';

describe('slugifyTitle', () => {
  it('lowercases and strips diacritics', () => {
    expect(slugifyTitle('Café Décisions')).toBe('cafe-decisions');
    expect(slugifyTitle('Åkander Señor')).toBe('akander-senor');
  });

  it('collapses punctuation and whitespace runs into single hyphens', () => {
    expect(slugifyTitle('On   Distributed --- Systems!!!')).toBe('on-distributed-systems');
    expect(slugifyTitle('C++ & You: A Guide')).toBe('c-you-a-guide');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugifyTitle('  !!! Hello !!!  ')).toBe('hello');
  });

  it('caps length at 60 chars and trims a trailing hyphen the cut exposes', () => {
    const slug = slugifyTitle('a'.repeat(59) + ' bcdef');
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('returns an empty string for empty or whitespace-only titles', () => {
    expect(slugifyTitle('')).toBe('');
    expect(slugifyTitle('   ')).toBe('');
    expect(slugifyTitle('!!!')).toBe('');
  });
});

describe('buildTalkSlug', () => {
  it('joins slug and rkey with a hyphen', () => {
    expect(buildTalkSlug('My Great Talk', 'abc123xyz4567')).toBe('my-great-talk-abc123xyz4567');
  });

  it('falls back to just the rkey when the slug is empty', () => {
    expect(buildTalkSlug('!!!', 'abc123xyz4567')).toBe('abc123xyz4567');
  });
});

describe('parseTalkRkey', () => {
  it('returns the substring after the last hyphen', () => {
    expect(parseTalkRkey('my-great-talk-abc123xyz4567')).toBe('abc123xyz4567');
  });

  it('returns the whole segment when there is no hyphen', () => {
    expect(parseTalkRkey('abc123xyz4567')).toBe('abc123xyz4567');
  });

  it('round-trips with buildTalkSlug', () => {
    const rkey = 'abc123xyz4567';
    expect(parseTalkRkey(buildTalkSlug('Any Title Here', rkey))).toBe(rkey);
    expect(parseTalkRkey(buildTalkSlug('!!!', rkey))).toBe(rkey);
  });
});
