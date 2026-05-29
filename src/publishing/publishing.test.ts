import { describe, it, expect } from 'vitest';

import {
  BasicThemeSchema,
  STANDARD_SITE_PUBLISHERS,
  StandardSiteDocumentRecordSchema,
  StandardSitePublicationRecordSchema,
  StandardSiteRecommendRecordSchema,
  StandardSiteSubscriptionRecordSchema,
  hasStandardSiteAssociatedRef,
  hostMatches,
  isStandardSiteAtUri,
  matchPublisherByHost,
  matchPublisherByUri,
} from './index.js';

describe('StandardSitePublicationRecordSchema', () => {
  it('accepts a minimal publication', () => {
    const parsed = StandardSitePublicationRecordSchema.parse({
      url: 'https://example.com',
      name: 'Example',
    });
    expect(parsed.name).toBe('Example');
  });

  it('accepts publication with full theme', () => {
    const parsed = StandardSitePublicationRecordSchema.parse({
      url: 'https://example.com',
      name: 'Example',
      basicTheme: {
        background: { r: 255, g: 255, b: 255 },
        foreground: { r: 0, g: 0, b: 0 },
        accent: { r: 30, g: 100, b: 200 },
        accentForeground: { r: 255, g: 255, b: 255 },
      },
    });
    expect(parsed.basicTheme?.accent.b).toBe(200);
  });

  it('rejects non-uri url', () => {
    expect(() =>
      StandardSitePublicationRecordSchema.parse({ url: 'not a url', name: 'x' }),
    ).toThrow();
  });

  it('rejects empty name', () => {
    expect(() =>
      StandardSitePublicationRecordSchema.parse({ url: 'https://example.com', name: '' }),
    ).toThrow();
  });
});

describe('StandardSiteDocumentRecordSchema', () => {
  it('accepts a document with https site reference', () => {
    const parsed = StandardSiteDocumentRecordSchema.parse({
      site: 'https://blog.example',
      title: 'Hello',
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(parsed.title).toBe('Hello');
  });

  it('accepts a document with at-uri site reference', () => {
    const parsed = StandardSiteDocumentRecordSchema.parse({
      site: 'at://did:plc:abc/site.standard.publication/xyz',
      title: 'Hello',
      publishedAt: '2026-01-01T00:00:00.000Z',
      path: '/posts/hello',
    });
    expect(parsed.path).toBe('/posts/hello');
  });

  it('rejects missing publishedAt', () => {
    expect(() =>
      StandardSiteDocumentRecordSchema.parse({ site: 'https://x', title: 't' }),
    ).toThrow();
  });

  it('rejects bad datetime', () => {
    expect(() =>
      StandardSiteDocumentRecordSchema.parse({
        site: 'https://x',
        title: 't',
        publishedAt: 'last tuesday',
      }),
    ).toThrow();
  });
});

describe('StandardSiteSubscriptionRecordSchema', () => {
  it('accepts an at-uri publication ref', () => {
    const parsed = StandardSiteSubscriptionRecordSchema.parse({
      publication: 'at://did:plc:abc/site.standard.publication/xyz',
    });
    expect(parsed.publication).toBe('at://did:plc:abc/site.standard.publication/xyz');
  });

  it('rejects non-at-uri', () => {
    expect(() =>
      StandardSiteSubscriptionRecordSchema.parse({ publication: 'https://x' }),
    ).toThrow();
  });
});

describe('StandardSiteRecommendRecordSchema', () => {
  it('requires createdAt', () => {
    expect(() =>
      StandardSiteRecommendRecordSchema.parse({
        document: 'at://did:plc:abc/site.standard.document/xyz',
      }),
    ).toThrow();
  });

  it('accepts a valid recommend', () => {
    const parsed = StandardSiteRecommendRecordSchema.parse({
      document: 'at://did:plc:abc/site.standard.document/xyz',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(parsed.document).toContain('document');
  });
});

describe('BasicThemeSchema', () => {
  it('rejects out-of-range rgb', () => {
    expect(() =>
      BasicThemeSchema.parse({
        background: { r: 256, g: 0, b: 0 },
        foreground: { r: 0, g: 0, b: 0 },
        accent: { r: 0, g: 0, b: 0 },
        accentForeground: { r: 0, g: 0, b: 0 },
      }),
    ).toThrow();
  });

  it('requires all four colors', () => {
    expect(() =>
      BasicThemeSchema.parse({
        background: { r: 0, g: 0, b: 0 },
        foreground: { r: 0, g: 0, b: 0 },
        accent: { r: 0, g: 0, b: 0 },
      }),
    ).toThrow();
  });
});

describe('publisher registry', () => {
  it('ships exactly the three allowlisted publishers (parity with bsky)', () => {
    expect(STANDARD_SITE_PUBLISHERS.map((p) => p.host)).toEqual([
      'leaflet.pub',
      'pckt.blog',
      'offprint.app',
    ]);
  });

  it('is frozen — additions must go through the registry file + review', () => {
    expect(Object.isFrozen(STANDARD_SITE_PUBLISHERS)).toBe(true);
  });
});

describe('hostMatches', () => {
  it('matches exact host', () => {
    expect(hostMatches('leaflet.pub', 'leaflet.pub')).toBe(true);
  });

  it('matches subdomain', () => {
    expect(hostMatches('me.leaflet.pub', 'leaflet.pub')).toBe(true);
  });

  it('rejects suffix collisions', () => {
    expect(hostMatches('evil-leaflet.pub', 'leaflet.pub')).toBe(false);
  });
});

describe('matchPublisherByHost / matchPublisherByUri', () => {
  it('matches an allowlisted host', () => {
    expect(matchPublisherByHost('leaflet.pub')?.name).toBe('Leaflet');
  });

  it('matches a subdomain of an allowlisted host', () => {
    expect(matchPublisherByHost('alice.offprint.app')?.iconKey).toBe('offprint');
  });

  it('is case-insensitive', () => {
    expect(matchPublisherByHost('PCKT.BLOG')?.name).toBe('pckt');
  });

  it('returns null for unknown host', () => {
    expect(matchPublisherByHost('unrelated.example')).toBeNull();
  });

  it('matchPublisherByUri parses host from uri', () => {
    expect(matchPublisherByUri('https://Leaflet.pub/me/post')?.name).toBe('Leaflet');
  });

  it('matchPublisherByUri tolerates bad input', () => {
    expect(matchPublisherByUri('not a url')).toBeNull();
    expect(matchPublisherByUri(undefined)).toBeNull();
  });
});

describe('isStandardSiteAtUri', () => {
  it('accepts publication uri', () => {
    expect(isStandardSiteAtUri('at://did:plc:abc/site.standard.publication/xyz')).toBe(true);
  });

  it('accepts document uri', () => {
    expect(isStandardSiteAtUri('at://did:plc:abc/site.standard.document/xyz')).toBe(true);
  });

  it('accepts subscription uri', () => {
    expect(isStandardSiteAtUri('at://did:plc:abc/site.standard.graph.subscription/xyz')).toBe(true);
  });

  it('rejects other collections', () => {
    expect(isStandardSiteAtUri('at://did:plc:abc/app.bsky.feed.post/xyz')).toBe(false);
  });

  it('rejects non-at uri', () => {
    expect(isStandardSiteAtUri('https://x')).toBe(false);
  });
});

describe('hasStandardSiteAssociatedRef', () => {
  it('returns true when any ref is Standard.site', () => {
    expect(
      hasStandardSiteAssociatedRef([
        { uri: 'at://did:plc:abc/app.bsky.feed.post/x' },
        { uri: 'at://did:plc:abc/site.standard.publication/y' },
      ]),
    ).toBe(true);
  });

  it('returns false when no ref is Standard.site', () => {
    expect(hasStandardSiteAssociatedRef([{ uri: 'at://did:plc:abc/app.bsky.feed.post/x' }])).toBe(
      false,
    );
  });

  it('tolerates undefined / empty', () => {
    expect(hasStandardSiteAssociatedRef(undefined)).toBe(false);
    expect(hasStandardSiteAssociatedRef([])).toBe(false);
  });
});
