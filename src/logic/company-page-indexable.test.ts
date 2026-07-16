import { describe, expect, it } from 'vitest';

import {
  COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS,
  isCompanyPageIndexable,
} from './company-page-indexable.js';

describe('isCompanyPageIndexable', () => {
  it('exposes the threshold as a named constant defaulting to 2', () => {
    expect(COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS).toBe(2);
  });

  it('indexes a rich UNCLAIMED page (claim status is not an input)', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme Corporation',
        description: 'We make everything.',
        industry: 'Manufacturing',
        logoUrl: 'https://cdn.example/acme.png',
      }),
    ).toBe(true);
  });

  it('does NOT index a name-only page', () => {
    expect(isCompanyPageIndexable({ canonicalName: 'Acme Corporation' })).toBe(false);
  });

  it('does NOT index name + exactly one field (below threshold)', () => {
    expect(isCompanyPageIndexable({ canonicalName: 'Acme', industry: 'Manufacturing' })).toBe(
      false,
    );
  });

  it('indexes name + exactly two fields (at threshold)', () => {
    expect(
      isCompanyPageIndexable({ canonicalName: 'Acme', industry: 'Manufacturing', founded: 1998 }),
    ).toBe(true);
  });

  it('does NOT index when the canonical name is missing or blank', () => {
    expect(isCompanyPageIndexable({ description: 'x', industry: 'y', logoUrl: 'z' })).toBe(false);
    expect(isCompanyPageIndexable({ canonicalName: '   ', description: 'x', industry: 'y' })).toBe(
      false,
    );
  });

  it('counts employeeCount and founded as firmographic content (not a Sifa gate)', () => {
    // employeeCount here is the EXTERNAL headcount (Wikidata P1128), one of the
    // optional firmographic fields -- not the Sifa-derived employee count, which
    // is never an input to indexability.
    expect(
      isCompanyPageIndexable({ canonicalName: 'Acme', employeeCount: 5000, founded: '1998' }),
    ).toBe(true);
  });

  it('treats empty strings and nullish values as absent', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        description: '',
        industry: null,
        logoUrl: undefined,
      }),
    ).toBe(false);
  });
});
