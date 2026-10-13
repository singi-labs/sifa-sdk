import { describe, expect, it } from 'vitest';

import {
  EXPORT_CONTACT_LIMITS,
  exportContactSchema,
  looksLikeEmail,
  normalizeExportContact,
  pickExportContact,
} from './export-contact.js';

const draft = {
  email: 'ada@example.com',
  phone: '+31 6 1234 5678',
  address: 'Main Street 1\n1234 AB Amsterdam',
  includeEmail: true,
  includePhone: true,
  includeAddress: true,
};

describe('pickExportContact', () => {
  it('returns every included, filled-in field', () => {
    expect(pickExportContact(draft)).toEqual({
      email: 'ada@example.com',
      phone: '+31 6 1234 5678',
      address: 'Main Street 1\n1234 AB Amsterdam',
    });
  });

  it('leaves out a field whose include box is off', () => {
    expect(pickExportContact({ ...draft, includePhone: false })).toEqual({
      email: 'ada@example.com',
      address: 'Main Street 1\n1234 AB Amsterdam',
    });
  });

  // An empty value with its box ticked must not print an empty "Phone:" line.
  it('leaves out a blank field even when it is included', () => {
    const picked = pickExportContact({ ...draft, phone: '   ' });
    expect('phone' in picked).toBe(false);
  });

  it('trims values and the blank lines around an address', () => {
    expect(
      pickExportContact({
        ...draft,
        email: '  ada@example.com ',
        address: '\n  Main Street 1  \n\n1234 AB Amsterdam \n',
      }),
    ).toEqual({
      email: 'ada@example.com',
      phone: '+31 6 1234 5678',
      address: 'Main Street 1\n1234 AB Amsterdam',
    });
  });

  // A pasted value can carry a line break or tab; email and phone are one line.
  it('collapses whitespace inside email and phone', () => {
    expect(
      pickExportContact({ ...draft, email: 'ada@\nexample.com', phone: '+31\t6  1234' }),
    ).toMatchObject({ email: 'ada@ example.com', phone: '+31 6 1234' });
  });

  it('handles Windows line endings in an address', () => {
    expect(pickExportContact({ ...draft, address: 'Main Street 1\r\n\r\nAmsterdam' }).address).toBe(
      'Main Street 1\nAmsterdam',
    );
  });

  it('returns an empty object when nothing is included', () => {
    expect(
      pickExportContact({
        ...draft,
        includeEmail: false,
        includePhone: false,
        includeAddress: false,
      }),
    ).toEqual({});
  });

  it('accepts a partial draft', () => {
    expect(pickExportContact({ email: 'a@b.co', includeEmail: true })).toEqual({
      email: 'a@b.co',
    });
  });
});

describe('normalizeExportContact', () => {
  it('normalises a contact the same way the pick does', () => {
    expect(
      normalizeExportContact({
        email: ' a@b.co ',
        phone: '\t',
        address: '\r\nStreet 1\r\n\r\nCity',
      }),
    ).toEqual({ email: 'a@b.co', address: 'Street 1\nCity' });
  });
});

describe('normalizeExportContact limits', () => {
  // The form and the API enforce the limits too; this holds them for any
  // caller that skips both.
  it.each(Object.entries(EXPORT_CONTACT_LIMITS))('caps %s at %i characters', (key, max) => {
    const out = normalizeExportContact({ [key]: 'x'.repeat(max + 50) });
    expect(out[key as keyof typeof out]).toHaveLength(max);
  });
});

describe('exportContactSchema', () => {
  it('accepts a picked contact', () => {
    expect(exportContactSchema.safeParse(pickExportContact(draft)).success).toBe(true);
  });

  it('accepts an empty contact', () => {
    expect(exportContactSchema.safeParse({}).success).toBe(true);
  });

  it.each(Object.entries(EXPORT_CONTACT_LIMITS))('rejects a %s over %i characters', (key, max) => {
    expect(exportContactSchema.safeParse({ [key]: 'x'.repeat(max + 1) }).success).toBe(false);
  });

  // Phone and address formats vary too much between countries to check. Email
  // is checked in the form as a warning only, so the schema must not refuse it.
  it('does not reject an email that looks wrong', () => {
    expect(exportContactSchema.safeParse({ email: 'not an email' }).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    expect(exportContactSchema.safeParse({ fax: '123' }).success).toBe(false);
  });
});

describe('looksLikeEmail', () => {
  it.each(['ada@example.com', 'a.b+cv@sub.example.co.uk'])('accepts %s', (value) => {
    expect(looksLikeEmail(value)).toBe(true);
  });

  it.each([
    '',
    'ada',
    'ada@',
    '@example.com',
    'ada@example',
    'ada @example.com',
    'a@b@example.com',
    'ada@.com',
    'ada@example.',
  ])('rejects %j', (value) => {
    expect(looksLikeEmail(value)).toBe(false);
  });

  // CodeQL js/polynomial-redos: a regex over this input backtracked on
  // '!@!.' followed by many '!.' repetitions.
  it('stays fast on a long adversarial input', () => {
    const start = performance.now();
    looksLikeEmail(`!@!.${'!.'.repeat(50_000)}`);
    expect(performance.now() - start).toBeLessThan(250);
  });
});
