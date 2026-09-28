import { describe, expect, it } from 'vitest';

import {
  COMPANY_PAGE_MIN_DESCRIPTION_LENGTH,
  COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS,
  COMPANY_PAGE_ROSTER_MIN_MEMBERS,
  companyPageRichness,
  isCompanyPageIndexable,
  type CompanyFirmographics,
} from './company-page-indexable.js';

const DESC = 'Acme builds industrial robots for car factories across Europe.';

/** Four real facts: description, logo, headcount, founded. One short of the line. */
const FOUR_FACTS: CompanyFirmographics = {
  canonicalName: 'Acme Corporation',
  description: DESC,
  logoUrl: 'https://cdn.example/acme.png',
  employeeCount: 5000,
  founded: '1998',
};

describe('isCompanyPageIndexable', () => {
  it('exposes the thresholds as named constants', () => {
    expect(COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS).toBe(5);
    expect(COMPANY_PAGE_MIN_DESCRIPTION_LENGTH).toBe(40);
    expect(COMPANY_PAGE_ROSTER_MIN_MEMBERS).toBe(5);
  });

  it('does NOT index a page one fact short of the line', () => {
    expect(companyPageRichness(FOUR_FACTS)).toBe(4);
    expect(isCompanyPageIndexable(FOUR_FACTS)).toBe(false);
  });

  it('indexes an unclaimed page with five real facts', () => {
    expect(isCompanyPageIndexable({ ...FOUR_FACTS, country: 'DE' })).toBe(true);
  });

  it('counts location from either country or the HQ block', () => {
    expect(companyPageRichness({ ...FOUR_FACTS, country: 'DE' })).toBe(5);
    expect(companyPageRichness({ ...FOUR_FACTS, hq: { city: 'Berlin' } })).toBe(5);
    expect(companyPageRichness({ ...FOUR_FACTS, hq: { city: null, country: null } })).toBe(4);
  });

  it('counts external links only when at least one is set', () => {
    expect(
      companyPageRichness({ ...FOUR_FACTS, externalLinks: { website: 'https://acme.test' } }),
    ).toBe(5);
    expect(companyPageRichness({ ...FOUR_FACTS, externalLinks: {} })).toBe(4);
  });

  it('never counts a Jev-inferred industry', () => {
    expect(
      isCompanyPageIndexable({ ...FOUR_FACTS, industry: 'Manufacturing', industrySource: 'jev' }),
    ).toBe(false);
    expect(
      isCompanyPageIndexable({
        ...FOUR_FACTS,
        industry: 'Manufacturing',
        industrySource: 'wikidata',
      }),
    ).toBe(true);
  });

  it('counts an industry with unknown provenance', () => {
    expect(companyPageRichness({ ...FOUR_FACTS, industry: 'Manufacturing' })).toBe(5);
  });

  it('ignores a description shorter than the minimum length', () => {
    expect(companyPageRichness({ ...FOUR_FACTS, description: 'company in Japan' })).toBe(3);
  });

  it('adds one bonus point for at least one Sifa member', () => {
    expect(companyPageRichness({ ...FOUR_FACTS, memberCount: 1 })).toBe(5);
    expect(isCompanyPageIndexable({ ...FOUR_FACTS, memberCount: 1 })).toBe(true);
    expect(companyPageRichness({ ...FOUR_FACTS, memberCount: 0 })).toBe(4);
  });

  it('always indexes a claimed page, however thin', () => {
    expect(isCompanyPageIndexable({ canonicalName: 'Acme', claimed: true })).toBe(true);
  });

  it('always indexes a page with a visible roster', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS,
      }),
    ).toBe(true);
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS - 1,
      }),
    ).toBe(false);
  });

  it('does NOT index when the canonical name is missing or blank', () => {
    expect(isCompanyPageIndexable({ ...FOUR_FACTS, canonicalName: undefined, claimed: true })).toBe(
      false,
    );
    expect(isCompanyPageIndexable({ ...FOUR_FACTS, canonicalName: '   ', country: 'DE' })).toBe(
      false,
    );
  });

  it('treats empty strings and nullish values as absent', () => {
    expect(
      companyPageRichness({
        canonicalName: 'Acme',
        description: '   ',
        industry: '',
        logoUrl: null,
        employeeCount: null,
        founded: undefined,
        country: '',
        externalLinks: null,
        memberCount: null,
      }),
    ).toBe(0);
  });

  it('does not count a non-finite employee count', () => {
    expect(companyPageRichness({ ...FOUR_FACTS, employeeCount: Number.NaN })).toBe(3);
  });
});

describe('CompanyFirmographics structural typing', () => {
  it('accepts an interface-typed HQ view', () => {
    interface HqView {
      address: string | null;
      city: string | null;
      region: string | null;
      postalCode: string | null;
      country: string | null;
      lat: number | null;
      lon: number | null;
    }
    const hq: HqView = {
      address: null,
      city: 'Berlin',
      region: null,
      postalCode: null,
      country: null,
      lat: null,
      lon: null,
    };
    expect(companyPageRichness({ ...FOUR_FACTS, hq })).toBe(5);
  });
});
