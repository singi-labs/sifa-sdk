import { describe, expect, it } from 'vitest';

import { GermDeclarationRecordSchema } from './germ-declaration.js';

// Shape of a real record (rkey `self`), with opaque bytes shortened.
const REAL = {
  $type: 'com.germnetwork.declaration',
  version: '1.1.0',
  currentKey: { $bytes: 'AQIDBA' },
  keyPackage: { $bytes: 'BQYHCA' },
  messageMe: {
    showButtonTo: 'usersIFollow',
    messageMeUrl: 'https://landing.ger.mx/newUser',
  },
};

describe('GermDeclarationRecordSchema', () => {
  it('parses a real record and keeps unknown keys', () => {
    const parsed = GermDeclarationRecordSchema.parse(REAL);
    expect(parsed.messageMe?.showButtonTo).toBe('usersIFollow');
    expect(parsed.currentKey).toEqual({ $bytes: 'AQIDBA' });
    expect((parsed as Record<string, unknown>).keyPackage).toEqual({ $bytes: 'BQYHCA' });
  });

  it.each(['0.0.1', '0.1.0', '1.0.0', '1.1.0'])('accepts version %s', (version) => {
    expect(GermDeclarationRecordSchema.safeParse({ ...REAL, version }).success).toBe(true);
  });

  it('accepts a record without messageMe', () => {
    const { messageMe: _omit, ...rest } = REAL;
    expect(GermDeclarationRecordSchema.safeParse(rest).success).toBe(true);
  });

  it('accepts an unknown showButtonTo value (knownValues, not an enum)', () => {
    const record = { ...REAL, messageMe: { ...REAL.messageMe, showButtonTo: 'friends' } };
    expect(GermDeclarationRecordSchema.safeParse(record).success).toBe(true);
  });

  it('rejects a record without currentKey', () => {
    const { currentKey: _omit, ...rest } = REAL;
    expect(GermDeclarationRecordSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts currentKey as decoded bytes', () => {
    expect(
      GermDeclarationRecordSchema.safeParse({ ...REAL, currentKey: new Uint8Array([1, 2]) })
        .success,
    ).toBe(true);
  });

  it('rejects currentKey as a plain string', () => {
    expect(GermDeclarationRecordSchema.safeParse({ ...REAL, currentKey: 'AQIDBA' }).success).toBe(
      false,
    );
  });

  it('rejects a version outside 5-14 characters', () => {
    expect(GermDeclarationRecordSchema.safeParse({ ...REAL, version: '1.0' }).success).toBe(false);
    expect(
      GermDeclarationRecordSchema.safeParse({ ...REAL, version: '1.0.0-beta.1234' }).success,
    ).toBe(false);
  });

  it('rejects messageMe with a missing field', () => {
    const record = { ...REAL, messageMe: { showButtonTo: 'everyone' } };
    expect(GermDeclarationRecordSchema.safeParse(record).success).toBe(false);
  });

  it('rejects an overlong messageMeUrl', () => {
    const record = {
      ...REAL,
      messageMe: {
        showButtonTo: 'everyone',
        messageMeUrl: `https://landing.ger.mx/${'a'.repeat(2048)}`,
      },
    };
    expect(GermDeclarationRecordSchema.safeParse(record).success).toBe(false);
  });
});
