import { describe, expect, it } from 'vitest';
import {
  EntitySearchResultSchema,
  EntitySearchResponseSchema,
  EntitySelectRequestSchema,
  EntitySelectResponseSchema,
} from './entity.js';

describe('EntitySearchResponseSchema', () => {
  it('parses a valid response with entity and pdl rows', () => {
    const parsed = EntitySearchResponseSchema.parse({
      results: [
        {
          source: 'entity',
          entityId: 1,
          kind: 'org',
          name: 'Spryker',
          domain: 'spryker.com',
          country: 'DE',
          logoUrl: null,
          parentName: null,
        },
        {
          source: 'pdl',
          pdlId: 'x',
          kind: 'org',
          name: 'Crawl',
          domain: 'crawl.example',
          country: null,
          logoUrl: null,
          parentName: null,
        },
      ],
      hasMore: true,
    });
    expect(parsed.results).toHaveLength(2);
    expect(parsed.hasMore).toBe(true);
  });

  it('rejects an invalid source', () => {
    expect(() =>
      EntitySearchResponseSchema.parse({
        results: [
          {
            source: 'nope',
            kind: 'org',
            name: 'X',
            domain: null,
            country: null,
            logoUrl: null,
            parentName: null,
          },
        ],
        hasMore: false,
      }),
    ).toThrow();
  });
});

describe('EntitySelectRequestSchema', () => {
  it('accepts entityId or pdlId', () => {
    expect(EntitySelectRequestSchema.parse({ entityId: 5 })).toEqual({ entityId: 5 });
    expect(EntitySelectRequestSchema.parse({ pdlId: 'abc' })).toEqual({ pdlId: 'abc' });
  });

  it('rejects an empty body', () => {
    expect(() => EntitySelectRequestSchema.parse({})).toThrow();
  });

  it('rejects supplying both entityId and pdlId (mutually exclusive)', () => {
    expect(() => EntitySelectRequestSchema.parse({ entityId: 5, pdlId: 'abc' })).toThrow();
  });
});

describe('EntitySearchResultSchema discriminated union', () => {
  it('requires entityId when source is entity', () => {
    expect(() =>
      EntitySearchResultSchema.parse({
        source: 'entity',
        kind: 'org',
        name: 'X',
        domain: null,
        country: null,
        logoUrl: null,
        parentName: null,
      }),
    ).toThrow();
  });

  it('rejects a javascript: scheme in logoUrl', () => {
    expect(() =>
      EntitySearchResultSchema.parse({
        source: 'entity',
        entityId: 1,
        kind: 'org',
        name: 'X',
        domain: null,
        country: null,
        logoUrl: 'javascript:alert(1)',
        parentName: null,
      }),
    ).toThrow();
  });
});

describe('EntitySelectResponseSchema', () => {
  it('parses a response with a null entityRef', () => {
    const parsed = EntitySelectResponseSchema.parse({
      entityId: 3,
      slug: 'acme',
      kind: 'org',
      canonicalName: 'Acme',
      domain: 'acme.com',
      entityRef: null,
    });
    expect(parsed.entityRef).toBeNull();
  });

  it('defaults website + websiteTier to null when the AppView omits them', () => {
    const parsed = EntitySelectResponseSchema.parse({
      entityId: 3,
      slug: 'acme',
      kind: 'org',
      canonicalName: 'Acme',
      domain: 'acme.com',
      entityRef: null,
    });
    expect(parsed.website).toBeNull();
    expect(parsed.websiteTier).toBeNull();
  });

  it('parses the trust-gated website and its tier', () => {
    const parsed = EntitySelectResponseSchema.parse({
      entityId: 3,
      slug: 'acme',
      kind: 'org',
      canonicalName: 'Acme',
      domain: 'acme.com',
      website: 'https://acme.com',
      websiteTier: 'curated',
      entityRef: null,
    });
    expect(parsed.website).toBe('https://acme.com');
    expect(parsed.websiteTier).toBe('curated');
  });

  it('rejects a crawled tier, which is never an acceptable website source', () => {
    expect(() =>
      EntitySelectResponseSchema.parse({
        entityId: 3,
        slug: 'acme',
        kind: 'org',
        canonicalName: 'Acme',
        domain: 'acme.com',
        website: 'https://acme.com',
        websiteTier: 'crawled',
        entityRef: null,
      }),
    ).toThrow();
  });
});
