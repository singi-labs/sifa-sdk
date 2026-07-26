import { describe, expect, it } from 'vitest';

import { OrgClaimRequestSchema } from './org-claim.js';
import {
  OrgDomainChallengeRequestSchema,
  OrgDomainVerifyRequestSchema,
  OrgNotificationEmailRequestSchema,
  OrgProfileUpdateRequestSchema,
} from './org-settings.js';

describe('OrgClaimRequestSchema', () => {
  it('accepts a valid claim body', () => {
    expect(
      OrgClaimRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['http://www.wikidata.org/entity/Q123'],
        authorityAck: true,
      }).success,
    ).toBe(true);
  });

  it('requires authorityAck === true', () => {
    expect(
      OrgClaimRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        authorityAck: false,
      }).success,
    ).toBe(false);
    expect(OrgClaimRequestSchema.safeParse({ name: 'Acme', entityRefs: ['q'] }).success).toBe(
      false,
    );
  });

  it('requires at least one entityRef', () => {
    expect(
      OrgClaimRequestSchema.safeParse({ name: 'Acme', entityRefs: [], authorityAck: true }).success,
    ).toBe(false);
  });
});

describe('OrgProfileUpdateRequestSchema', () => {
  it('accepts a valid update body with a logo blob ref', () => {
    expect(
      OrgProfileUpdateRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        logo: { $type: 'blob', ref: { $link: 'bafy' }, mimeType: 'image/png', size: 1000 },
      }).success,
    ).toBe(true);
  });

  it('does NOT accept authorityAck (not part of the update body)', () => {
    const result = OrgProfileUpdateRequestSchema.safeParse({ name: 'Acme', entityRefs: ['q'] });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed logo blob ref', () => {
    expect(
      OrgProfileUpdateRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        logo: { $type: 'blob', ref: {}, mimeType: '', size: -1 },
      }).success,
    ).toBe(false);
  });
});

describe('org domain + notification-email request schemas', () => {
  it('validates the challenge / verify bodies', () => {
    expect(OrgDomainChallengeRequestSchema.safeParse({ domain: 'acme.com' }).success).toBe(true);
    expect(OrgDomainChallengeRequestSchema.safeParse({ domain: '' }).success).toBe(false);
    expect(OrgDomainVerifyRequestSchema.safeParse({ token: 'abc' }).success).toBe(true);
    expect(OrgDomainVerifyRequestSchema.safeParse({ token: '' }).success).toBe(false);
  });

  it('validates the notification-email body', () => {
    expect(OrgNotificationEmailRequestSchema.safeParse({ email: 'ir@acme.com' }).success).toBe(
      true,
    );
    expect(OrgNotificationEmailRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(
      false,
    );
  });
});

describe('personalProfileVisible on the org request bodies (#327)', () => {
  const claimBase = {
    name: 'Vincent Santelé',
    entityRefs: ['https://www.wikidata.org/wiki/Q123'],
    authorityAck: true as const,
  };
  const updateBase = {
    name: 'Vincent Santelé',
    entityRefs: ['https://www.wikidata.org/wiki/Q123'],
  };

  it('is optional on both bodies', () => {
    expect(OrgClaimRequestSchema.safeParse(claimBase).success).toBe(true);
    expect(OrgProfileUpdateRequestSchema.safeParse(updateBase).success).toBe(true);
  });

  it('round-trips a boolean on both bodies', () => {
    const claim = OrgClaimRequestSchema.safeParse({ ...claimBase, personalProfileVisible: true });
    expect(claim.success && claim.data.personalProfileVisible).toBe(true);
    const update = OrgProfileUpdateRequestSchema.safeParse({
      ...updateBase,
      personalProfileVisible: false,
    });
    expect(update.success && update.data.personalProfileVisible).toBe(false);
  });

  it('rejects a non-boolean', () => {
    expect(
      OrgClaimRequestSchema.safeParse({ ...claimBase, personalProfileVisible: 'yes' }).success,
    ).toBe(false);
  });
});
