import { describe, expect, it } from 'vitest';
import { ProfileInvestmentRecordSchema } from './profile-investment.js';

const base = {
  company: 'ShopAgentic',
  createdAt: '2026-04-01T00:00:00.000Z',
};

describe('ProfileInvestmentRecordSchema', () => {
  it('accepts a minimal record', () => {
    const parsed = ProfileInvestmentRecordSchema.parse(base);
    expect(parsed.company).toBe('ShopAgentic');
  });

  // An investment renders as a list rather than a timeline, so a missing month does
  // not break the display the way it would on a career entry.
  it('requires only company and createdAt', () => {
    expect(() => ProfileInvestmentRecordSchema.parse({ createdAt: base.createdAt })).toThrow();
    expect(() => ProfileInvestmentRecordSchema.parse({ company: 'X' })).toThrow();
  });

  it('accepts the full capital position', () => {
    const parsed = ProfileInvestmentRecordSchema.parse({
      ...base,
      role: 'id.sifa.defs#angelInvestment',
      stage: 'id.sifa.defs#stageSeed',
      status: 'id.sifa.defs#investmentActive',
      via: 'Leodor Ventures',
      viaDid: 'did:plc:leodor',
      viaEntityRef: 'http://www.wikidata.org/entity/Q42',
      startedAt: '2026-04',
      amount: { value: 25000, currency: 'EUR' },
    });
    expect(parsed.amount).toEqual({ value: 25000, currency: 'EUR' });
    expect(parsed.via).toBe('Leodor Ventures');
  });

  // Same guard as entityRef (#159): a script-bearing scheme must never reach a PDS record.
  it('rejects a script-bearing viaEntityRef', () => {
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, viaEntityRef: 'javascript:alert(1)' }),
    ).toThrow();
  });

  it('rejects a script-bearing entityRef', () => {
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, entityRef: 'javascript:alert(1)' }),
    ).toThrow();
  });

  // Free text was rejected for amounts: an unparseable money string cannot be fixed
  // later, once people have written them.
  it('requires both value and currency on an amount', () => {
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, amount: { value: 100 } }),
    ).toThrow();
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, amount: { currency: 'EUR' } }),
    ).toThrow();
  });

  it('rejects a negative or fractional amount', () => {
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, amount: { value: -5, currency: 'EUR' } }),
    ).toThrow();
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, amount: { value: 1.5, currency: 'EUR' } }),
    ).toThrow();
  });

  it('rejects a currency that is not three letters', () => {
    expect(() =>
      ProfileInvestmentRecordSchema.parse({ ...base, amount: { value: 100, currency: 'EURO' } }),
    ).toThrow();
  });

  it('omits the amount entirely by default', () => {
    const parsed = ProfileInvestmentRecordSchema.parse(base);
    expect(parsed.amount).toBeUndefined();
  });
});
