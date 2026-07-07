import { describe, expect, it } from 'vitest';
import {
  entityDisambiguationLabel,
  searchResultDisambiguation,
  entityResultKey,
} from './entity-disambiguation.js';
import type { EntitySearchResult } from '../schemas/entity.js';

describe('entityDisambiguationLabel', () => {
  it('joins the present fields with a middot', () => {
    expect(
      entityDisambiguationLabel({
        domain: 'spryker.com',
        country: 'DE',
        parentName: 'Spryker Holding',
      }),
    ).toBe('spryker.com · DE · part of Spryker Holding');
  });

  it('omits missing fields', () => {
    expect(entityDisambiguationLabel({ domain: 'acme.com', country: null, parentName: null })).toBe(
      'acme.com',
    );
    expect(entityDisambiguationLabel({})).toBe('');
  });
});

describe('searchResultDisambiguation + entityResultKey', () => {
  const entityRow: EntitySearchResult = {
    source: 'entity',
    entityId: 7,
    kind: 'org',
    name: 'Spryker Systems',
    domain: 'spryker.com',
    country: 'DE',
    logoUrl: null,
    parentName: 'Spryker Holding',
  };
  const pdlRow: EntitySearchResult = {
    source: 'pdl',
    pdlId: 'abc',
    kind: 'org',
    name: 'Crawl Co',
    domain: 'crawlco.example',
    country: null,
    logoUrl: null,
    parentName: null,
  };

  it('formats a full disambiguation line from a result', () => {
    expect(searchResultDisambiguation(entityRow)).toBe(
      'spryker.com · DE · part of Spryker Holding',
    );
  });

  it('derives a stable per-source key', () => {
    expect(entityResultKey(entityRow)).toBe('entity:7');
    expect(entityResultKey(pdlRow)).toBe('pdl:abc');
  });
});
