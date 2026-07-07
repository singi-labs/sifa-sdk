import { describe, expect, it } from 'vitest';
import {
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
});
