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
