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

  it('accepts the self-declared fields seeded at claim time', () => {
    expect(
      OrgClaimRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        authorityAck: true,
        addresses: [{ country: 'NL', locality: 'Amsterdam' }],
        companySize: '11-50',
        links: [{ name: 'Blog', url: 'https://acme.com/blog' }],
        industries: [{ industry: 'id.sifa.defs#industryTechnology' }],
        founded: '1998',
        aliases: ['ACME'],
      }).success,
    ).toBe(true);
  });

  it('rejects a non-http(s) link url and a malformed founded on the claim body', () => {
    expect(
      OrgClaimRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        authorityAck: true,
        links: [{ name: 'x', url: 'javascript:alert(1)' }],
      }).success,
    ).toBe(false);
    expect(
      OrgClaimRequestSchema.safeParse({
        name: 'Acme',
        entityRefs: ['q'],
        authorityAck: true,
        founded: 'not-a-date',
      }).success,
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

  // The /c/ page owner editors send addresses / companySize / links; the
  // sifa-api profileBodySchema accepts all three. This schema must mirror it.
  describe('addresses / companySize / links (mirror sifa-api profileBodySchema)', () => {
    const base = { name: 'Acme', entityRefs: ['q'] };

    it('accepts structured addresses, a companySize band, and featured links', () => {
      const result = OrgProfileUpdateRequestSchema.safeParse({
        ...base,
        addresses: [{ country: 'NL', locality: 'Amsterdam', name: 'Head office' }],
        companySize: '11-50',
        links: [{ name: 'Blog', url: 'https://acme.com/blog' }],
      });
      expect(result.success).toBe(true);
    });

    it('treats all three as optional', () => {
      expect(OrgProfileUpdateRequestSchema.safeParse(base).success).toBe(true);
    });

    it('rejects a link whose url is not http(s)', () => {
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          links: [{ name: 'x', url: 'javascript:alert(1)' }],
        }).success,
      ).toBe(false);
    });

    it('requires both name and url on a link', () => {
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          links: [{ url: 'https://acme.com' }],
        }).success,
      ).toBe(false);
      expect(
        OrgProfileUpdateRequestSchema.safeParse({ ...base, links: [{ name: 'x' }] }).success,
      ).toBe(false);
    });

    it('caps addresses and links at 20 (matching sifa-api)', () => {
      const address = { country: 'NL' };
      const link = { name: 'x', url: 'https://acme.com' };
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          addresses: Array.from({ length: 20 }, () => address),
        }).success,
      ).toBe(true);
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          addresses: Array.from({ length: 21 }, () => address),
        }).success,
      ).toBe(false);
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          links: Array.from({ length: 21 }, () => link),
        }).success,
      ).toBe(false);
    });
  });

  describe('self-declared industries / founded / aliases', () => {
    const base = { name: 'Acme', entityRefs: ['q'] };

    it('accepts industries, founded, and aliases', () => {
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          industries: [
            { industry: 'id.sifa.defs#industryTechnology', domain: 'id.sifa.defs#domainHardware' },
          ],
          founded: '1998-03',
          aliases: ['ACME', 'Acme Corp'],
        }).success,
      ).toBe(true);
    });

    it('requires the industry token and caps industries at 10 / aliases at 20', () => {
      expect(OrgProfileUpdateRequestSchema.safeParse({ ...base, industries: [{}] }).success).toBe(
        false,
      );
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          industries: Array.from({ length: 11 }, () => ({ industry: 'x' })),
        }).success,
      ).toBe(false);
      expect(
        OrgProfileUpdateRequestSchema.safeParse({
          ...base,
          aliases: Array.from({ length: 21 }, (_, i) => `A${i}`),
        }).success,
      ).toBe(false);
    });
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
