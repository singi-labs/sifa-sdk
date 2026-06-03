import { describe, expect, it } from 'vitest';
import {
  PUBLISHERS,
  STANDARD_PUBLISHER_ID,
  getPublisherById,
  getPublisherByHost,
  getPublisherFromSiteUrl,
} from './registry.js';

describe('PUBLISHERS', () => {
  it('has unique ids', () => {
    const ids = PUBLISHERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique hostSuffixes across publishers', () => {
    const suffixes = PUBLISHERS.flatMap((p) => p.hostSuffixes);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it('does not register the neutral standard id', () => {
    expect(PUBLISHERS.find((p) => p.id === STANDARD_PUBLISHER_ID)).toBeUndefined();
  });

  it('homeUrl is a parseable URL for every publisher', () => {
    for (const p of PUBLISHERS) {
      expect(() => new URL(p.homeUrl)).not.toThrow();
    }
  });
});

describe('getPublisherById', () => {
  it('returns Leaflet for "leaflet"', () => {
    expect(getPublisherById('leaflet')?.name).toBe('Leaflet');
  });

  it('returns undefined for unknown id', () => {
    expect(getPublisherById('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for the neutral standard id (not a registered publisher)', () => {
    expect(getPublisherById(STANDARD_PUBLISHER_ID)).toBeUndefined();
  });
});

describe('getPublisherByHost', () => {
  it('matches exact host', () => {
    expect(getPublisherByHost('leaflet.pub')?.id).toBe('leaflet');
  });

  it('matches dotted subdomain', () => {
    expect(getPublisherByHost('notesbyarielm.leaflet.pub')?.id).toBe('leaflet');
  });

  it('is case-insensitive', () => {
    expect(getPublisherByHost('NOTESBYARIELM.LEAFLET.PUB')?.id).toBe('leaflet');
  });

  it('does not match a host that merely contains the suffix string', () => {
    // "fakeleaflet.pub" must NOT match "leaflet.pub" — only equal or dotted suffix.
    expect(getPublisherByHost('fakeleaflet.pub')).toBeUndefined();
  });

  it('returns undefined for unknown hosts', () => {
    expect(getPublisherByHost('example.com')).toBeUndefined();
  });
});

describe('getPublisherFromSiteUrl', () => {
  it('returns branded publisher for a known host', () => {
    const p = getPublisherFromSiteUrl('https://notesbyarielm.leaflet.pub');
    expect(p.id).toBe('leaflet');
    expect(p.name).toBe('Leaflet');
  });

  it('returns synthetic standard publisher with hostname as name for unknown hosts', () => {
    const p = getPublisherFromSiteUrl('https://feeds.byarielm.fyi');
    expect(p.id).toBe(STANDARD_PUBLISHER_ID);
    expect(p.name).toBe('feeds.byarielm.fyi');
    expect(p.homeUrl).toBe('https://feeds.byarielm.fyi');
  });

  it('strips path and query from synthetic homeUrl', () => {
    const p = getPublisherFromSiteUrl('https://example.com/some/path?x=1');
    expect(p.homeUrl).toBe('https://example.com');
  });

  it('falls back defensively on unparseable input', () => {
    const p = getPublisherFromSiteUrl('not a url');
    expect(p.id).toBe(STANDARD_PUBLISHER_ID);
    expect(p.name).toBe('not a url');
    expect(p.homeUrl).toBe('not a url');
  });
});
