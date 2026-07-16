import { describe, expect, it } from 'vitest';

import { isRegistrableDomainHandle, qualifiesAsOrg } from './org-floor.js';
import type { OrgProfileRecord } from '../schemas/org-profile.js';

const record: OrgProfileRecord = {
  name: 'Acme',
  createdAt: '2026-07-16T00:00:00.000Z',
};

describe('isRegistrableDomainHandle', () => {
  it('accepts a custom registrable domain handle', () => {
    expect(isRegistrableDomainHandle('acme.com')).toBe(true);
    expect(isRegistrableDomainHandle('nike.co.uk')).toBe(true);
  });

  it('rejects *.bsky.social and other shared PDS hosts', () => {
    expect(isRegistrableDomainHandle('acme.bsky.social')).toBe(false);
    expect(isRegistrableDomainHandle('acme.eurosky.social')).toBe(false);
    expect(isRegistrableDomainHandle('acme.blacksky.app')).toBe(false);
  });

  it('rejects bare / no-dot handles', () => {
    expect(isRegistrableDomainHandle('acme')).toBe(false);
    expect(isRegistrableDomainHandle('')).toBe(false);
  });

  it('rejects DIDs', () => {
    expect(isRegistrableDomainHandle('did:plc:abc123')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isRegistrableDomainHandle('Acme.COM')).toBe(true);
    expect(isRegistrableDomainHandle('Acme.BSKY.social')).toBe(false);
  });
});

describe('qualifiesAsOrg', () => {
  it('renders as org: record present AND custom domain handle', () => {
    expect(qualifiesAsOrg(record, 'acme.com')).toBe(true);
  });

  it('does not render as org when the record is absent', () => {
    expect(qualifiesAsOrg(null, 'acme.com')).toBe(false);
    expect(qualifiesAsOrg(undefined, 'acme.com')).toBe(false);
  });

  it('does not render as org when the handle fails the floor', () => {
    expect(qualifiesAsOrg(record, 'acme.bsky.social')).toBe(false);
    expect(qualifiesAsOrg(record, 'acme')).toBe(false);
  });
});
