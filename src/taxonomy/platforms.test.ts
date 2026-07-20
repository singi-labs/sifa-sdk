import { describe, it, expect } from 'vitest';
import { normalizePlatformId, getPlatformLabel } from './platforms.js';

describe('normalizePlatformId', () => {
  it('maps a lexicon platform token to its short code', () => {
    expect(normalizePlatformId('id.sifa.defs#platformLinkedin')).toBe('linkedin');
  });

  it('maps every lexicon platform token to its lowercase suffix', () => {
    expect(normalizePlatformId('id.sifa.defs#platformGithub')).toBe('github');
    expect(normalizePlatformId('id.sifa.defs#platformYoutube')).toBe('youtube');
    expect(normalizePlatformId('id.sifa.defs#platformRss')).toBe('rss');
    expect(normalizePlatformId('id.sifa.defs#platformOrcid')).toBe('orcid');
    expect(normalizePlatformId('id.sifa.defs#platformOther')).toBe('other');
  });

  it('passes a short code through unchanged', () => {
    expect(normalizePlatformId('linkedin')).toBe('linkedin');
    expect(normalizePlatformId('website')).toBe('website');
  });

  it('passes an unknown value through unchanged', () => {
    expect(normalizePlatformId('friendster')).toBe('friendster');
  });

  it('maps Fediverse synonyms (activitypub, mastodon) to fediverse', () => {
    expect(normalizePlatformId('activitypub')).toBe('fediverse');
    expect(normalizePlatformId('mastodon')).toBe('fediverse');
    expect(normalizePlatformId('ActivityPub')).toBe('fediverse');
  });
});

describe('getPlatformLabel', () => {
  it('labels a short code', () => {
    expect(getPlatformLabel('linkedin')).toBe('LinkedIn');
  });

  it('labels a lexicon platform token by normalizing it first', () => {
    expect(getPlatformLabel('id.sifa.defs#platformLinkedin')).toBe('LinkedIn');
  });

  it('falls back to the Website label for an unknown platform', () => {
    expect(getPlatformLabel('friendster')).toBe('Website');
  });

  it('labels Fediverse synonyms as Fediverse', () => {
    expect(getPlatformLabel('activitypub')).toBe('Fediverse');
    expect(getPlatformLabel('mastodon')).toBe('Fediverse');
  });
});
