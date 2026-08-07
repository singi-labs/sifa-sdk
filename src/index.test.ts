import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  SIFA_SDK_VERSION,
  INVOLVEMENT_KIND_OPTIONS,
  PROFILE_INVOLVEMENT_NSID,
  getArtifactLinkKindLabel,
  INVESTMENT_ROLE_OPTIONS,
  INVESTMENT_STATUS_OPTIONS,
  getInvestmentRoleLabel,
  ProfileInvestmentRecordSchema,
  ON_BEHALF_OF_EMPLOYMENT_TYPES,
  isOnBehalfOfApplicable,
  getInvolvementKindHeading,
  PROJECT_ROLES,
  type ActorCard,
  type Endorsement,
  type ProjectMemberCard,
  type ProjectMemberView,
  type ProjectRole,
  type LanguageProficiency,
  type Profile,
  type ProfileCertification,
  type ProfileInvolvement,
  type ProfileInvestment,
  type ProfilePosition,
} from './index.js';

describe('SIFA_SDK_VERSION', () => {
  it('exports a non-empty version string', () => {
    expect(typeof SIFA_SDK_VERSION).toBe('string');
    expect(SIFA_SDK_VERSION.length).toBeGreaterThan(0);
  });

  it('matches a semver-like shape', () => {
    expect(SIFA_SDK_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('exported types', () => {
  it('Profile accepts a minimal claimed profile', () => {
    const profile: Profile = {
      did: 'did:plc:example',
      handle: 'alice.sifa.id',
      claimed: true,
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      positions: [],
      education: [],
      skills: [],
    };
    expect(profile.did).toBe('did:plc:example');
  });

  it('ProfilePosition allows optional skill linking', () => {
    const position: ProfilePosition = {
      rkey: 'abc',
      company: 'Sifa',
      title: 'Founder',
      startedAt: '2026-01-01T00:00:00Z',
      skills: [{ uri: 'at://did:plc:example/id.sifa.profile.skill/xyz' }],
    };
    expect(position.skills).toHaveLength(1);
  });

  it('ProfilePosition carries employmentType and workplaceType', () => {
    const position: ProfilePosition = {
      rkey: 'abc',
      company: 'Sifa',
      title: 'Founder',
      startedAt: '2026-01-01T00:00:00Z',
      employmentType: 'id.sifa.defs#fullTime',
      workplaceType: 'id.sifa.defs#remote',
    };
    expect(position.employmentType).toBe('id.sifa.defs#fullTime');
    expect(position.workplaceType).toBe('id.sifa.defs#remote');
  });

  it('ProfileCertification carries authority as the canonical issuing-org field (#249)', () => {
    const cert: ProfileCertification = {
      rkey: 'abc',
      name: 'AWS Certified Solutions Architect',
      authority: 'Amazon Web Services',
    };
    expect(cert.authority).toBe('Amazon Web Services');
    // The legacy `issuingOrg` alias stays assignable during the deprecation
    // window but is no longer required to construct a certification.
    expectTypeOf<ProfileCertification['authority']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ProfileCertification['issuingOrg']>().toEqualTypeOf<string | undefined>();
  });

  it('LanguageProficiency is a fixed union', () => {
    expectTypeOf<LanguageProficiency>().toEqualTypeOf<
      'elementary' | 'limited_working' | 'professional_working' | 'full_professional' | 'native'
    >();
  });

  it('re-exports the involvement taxonomy + schema symbols from the main entry', () => {
    expect(PROFILE_INVOLVEMENT_NSID).toBe('id.sifa.profile.involvement');
    expect(getInvolvementKindHeading('id.sifa.defs#involvementOpenSource')).toBe('Open Source');
    expect(getArtifactLinkKindLabel('pull-request')).toBe('Pull request');
    expect(INVOLVEMENT_KIND_OPTIONS).toHaveLength(5);
  });

  it('ProfileInvolvement carries kind and links with the rung-2 signal', () => {
    const involvement: ProfileInvolvement = {
      rkey: 'abc',
      kind: 'id.sifa.defs#involvementOpenSource',
      links: [{ url: 'https://github.com/x/y/pull/1', verified: true, verifiedPlatform: 'github' }],
    };
    expect(involvement.links?.[0]?.verified).toBe(true);
  });

  it('Endorsement requires endorser identity and createdAt', () => {
    const endorsement: Endorsement = {
      endorserDid: 'did:plc:bob',
      endorserHandle: 'bob.sifa.id',
      createdAt: '2026-05-14T12:00:00Z',
    };
    expect(endorsement.endorserHandle).toBe('bob.sifa.id');
  });
});

// These appear in the signatures of exported interfaces -- ProfileProject.members
// is ProjectMemberCard[], ProjectView.members is ProjectMemberView[] -- so a
// consumer must be able to name them. They shipped in 0.12.45 defined but not
// re-exported, which nothing caught because the barrel tests only covered
// fetchers and hooks.
describe('people-link types are nameable by consumers', () => {
  it('ActorCard carries the confirmation state the render rule turns on', () => {
    const card: ActorCard = {
      did: 'did:plc:alice',
      handle: 'alice.test',
      confirmed: false,
    };
    expect(card.confirmed).toBe(false);
    expect(card.displayName).toBeUndefined();
  });

  it('ProjectMemberCard extends ActorCard with a role', () => {
    const member: ProjectMemberCard = {
      did: 'did:plc:alice',
      handle: 'alice.test',
      confirmed: true,
      role: 'id.sifa.defs#projectCore',
      title: 'Backend',
    };
    expectTypeOf(member).toExtend<ActorCard>();
    expect(member.role).toBe('id.sifa.defs#projectCore');
  });

  it('ProjectMemberView is nameable', () => {
    const view: ProjectMemberView = { did: 'did:plc:alice', handle: 'alice.test' };
    expect(view.handle).toBe('alice.test');
  });

  it('PROJECT_ROLES exports the known values', () => {
    expect(PROJECT_ROLES).toEqual([
      'id.sifa.defs#projectOwner',
      'id.sifa.defs#projectCore',
      'id.sifa.defs#projectContributor',
    ]);
    expectTypeOf<ProjectRole>().toExtend<string>();
  });
});

// The taxonomy barrel is an explicit allowlist, so a symbol can exist in its module
// and be missing from the package entry point. Module-level tests cannot catch that:
// they import the file directly. Asserted here, from the public entry, because
// sifa-web failed to typecheck on exactly this gap.
describe('employment-type public exports', () => {
  it('exposes the onBehalfOf predicate and its set from the package root', () => {
    expect(typeof isOnBehalfOfApplicable).toBe('function');
    expect(isOnBehalfOfApplicable('id.sifa.defs#boardMember')).toBe(true);
    expect(isOnBehalfOfApplicable('id.sifa.defs#fullTime')).toBe(false);
    expect(ON_BEHALF_OF_EMPLOYMENT_TYPES.has('id.sifa.defs#advisor')).toBe(true);
  });
});

// The taxonomy and schema barrels are explicit allowlists, and the root index is a
// second one. Module-level tests import the file directly, so they cannot catch a
// symbol that never leaves the package -- which is how isOnBehalfOfApplicable
// shipped unreachable in 0.12.66.
describe('investment public exports', () => {
  it('exposes the investment taxonomy from the package root', () => {
    expect(INVESTMENT_ROLE_OPTIONS.length).toBeGreaterThan(0);
    expect(INVESTMENT_STATUS_OPTIONS.map((o) => o.value)).toContain(
      'id.sifa.defs#investmentWrittenOff',
    );
    expect(getInvestmentRoleLabel('id.sifa.defs#angelInvestment')).toBe('Angel');
  });

  it('exposes the investment record schema from the package root', () => {
    const parsed = ProfileInvestmentRecordSchema.parse({
      company: 'ShopAgentic',
      createdAt: '2026-04-01T00:00:00.000Z',
    });
    expect(parsed.company).toBe('ShopAgentic');
  });

  it('exposes the ProfileInvestment type from the package root', () => {
    expectTypeOf<ProfileInvestment>().toHaveProperty('company');
    expectTypeOf<ProfileInvestment>().toHaveProperty('status');
  });
});
