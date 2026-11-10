import { describe, expect, it } from 'vitest';

import {
  COMPANY_PAGE_ROSTER_MIN_MEMBERS,
  isCompanyPageIndexable,
} from './company-page-indexable.js';

describe('isCompanyPageIndexable', () => {
  it('exposes the roster threshold as a named constant', () => {
    expect(COMPANY_PAGE_ROSTER_MIN_MEMBERS).toBe(5);
  });

  it('indexes a claimed page, however thin', () => {
    expect(isCompanyPageIndexable({ canonicalName: 'Acme', claimed: true })).toBe(true);
  });

  it('indexes a page with a visible roster', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS,
      }),
    ).toBe(true);
  });

  it('does NOT index an unclaimed page below the roster threshold', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS - 1,
        claimed: false,
      }),
    ).toBe(false);
  });

  it('does NOT index an unclaimed page without members, however many facts it has', () => {
    const richButEmpty = {
      canonicalName: 'Acme Corporation',
      description: 'Acme builds industrial robots for car factories across Europe.',
      logoUrl: 'https://cdn.example/acme.png',
      employeeCount: 5000,
      founded: '1998',
      country: 'DE',
    };
    expect(isCompanyPageIndexable(richButEmpty)).toBe(false);
  });

  it('treats nullish member counts and claim flags as absent', () => {
    expect(
      isCompanyPageIndexable({ canonicalName: 'Acme', memberCount: null, claimed: null }),
    ).toBe(false);
  });

  it('indexes an unclaimed page exactly at the roster threshold', () => {
    expect(
      isCompanyPageIndexable({
        canonicalName: 'Acme',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS,
        claimed: false,
      }),
    ).toBe(true);
  });

  it('does not count a non-finite member count', () => {
    for (const memberCount of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(isCompanyPageIndexable({ canonicalName: 'Acme', memberCount })).toBe(false);
    }
  });

  it('does NOT index when the canonical name is missing or blank', () => {
    expect(isCompanyPageIndexable({ canonicalName: undefined, claimed: true })).toBe(false);
    expect(
      isCompanyPageIndexable({
        canonicalName: '   ',
        memberCount: COMPANY_PAGE_ROSTER_MIN_MEMBERS,
      }),
    ).toBe(false);
  });
});
