import { describe, expect, it } from 'vitest';

import {
  hasPersonalProfileContent,
  isRegistrableDomainHandle,
  qualifiesAsOrg,
  rendersPersonalProfile,
} from './org-floor.js';
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

describe('hasPersonalProfileContent', () => {
  it('is false for a fresh account with nothing filled in', () => {
    expect(hasPersonalProfileContent({})).toBe(false);
    expect(hasPersonalProfileContent({ positions: [], education: [], skills: [] })).toBe(false);
  });

  it('is true when any section holds a record', () => {
    expect(hasPersonalProfileContent({ positions: [{}] })).toBe(true);
    expect(hasPersonalProfileContent({ education: [{}] })).toBe(true);
    expect(hasPersonalProfileContent({ skills: [{}] })).toBe(true);
    expect(hasPersonalProfileContent({ courses: [{}] })).toBe(true);
  });

  it('is true when the headline or about text is filled', () => {
    expect(hasPersonalProfileContent({ headline: 'Freelance developer' })).toBe(true);
    expect(hasPersonalProfileContent({ about: 'I build things.' })).toBe(true);
  });

  it('ignores blank and whitespace-only text', () => {
    expect(hasPersonalProfileContent({ headline: '', about: '   ' })).toBe(false);
    expect(hasPersonalProfileContent({ headline: null, about: null })).toBe(false);
  });
});

describe('rendersPersonalProfile', () => {
  it('renders for a plain person, with or without a verdict', () => {
    expect(rendersPersonalProfile(null)).toBe(true);
    expect(rendersPersonalProfile(undefined)).toBe(true);
    expect(rendersPersonalProfile({ isOrg: false, recognized: false })).toBe(true);
  });

  it('does not render for a company account that did not opt in', () => {
    expect(rendersPersonalProfile({ isOrg: true, recognized: false })).toBe(false);
    expect(rendersPersonalProfile({ isOrg: false, recognized: true })).toBe(false);
    expect(rendersPersonalProfile({ isOrg: true, recognized: true })).toBe(false);
    expect(
      rendersPersonalProfile({ isOrg: true, recognized: true, personalProfileVisible: false }),
    ).toBe(false);
  });

  it('renders for a claimed org that kept its personal profile (the sole trader)', () => {
    expect(
      rendersPersonalProfile({ isOrg: true, recognized: false, personalProfileVisible: true }),
    ).toBe(true);
    expect(
      rendersPersonalProfile({ isOrg: true, recognized: true, personalProfileVisible: true }),
    ).toBe(true);
  });

  it('does not let a merely recognized account opt in without claiming', () => {
    // The flag lives in the org record, so this state cannot occur on the wire.
    // Pinned anyway: recognition alone must never unlock the person facet.
    expect(
      rendersPersonalProfile({ isOrg: false, recognized: true, personalProfileVisible: true }),
    ).toBe(false);
  });
});
