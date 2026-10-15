import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { EXPORT_CONTACT_LIMITS, exportContactSchema } from '../resume/export-contact.js';
import { SAMPLE_EXPORT_CONTACT, WIRE_PROFILES } from './index.js';

describe('testing entry', () => {
  // `pnpm fixtures:wire` writes the files; a new one is only used once listed.
  it('lists every wire fixture file', () => {
    const files = readdirSync(join(import.meta.dirname, 'wire'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(WIRE_PROFILES.map((w) => w.name).sort()).toEqual(files);
  });

  it('gives every wire profile a handle and positions', () => {
    for (const { profile } of WIRE_PROFILES) {
      expect(profile.handle).toBeTruthy();
      expect(profile.positions.length).toBeGreaterThan(0);
    }
  });

  it('fills every export contact field with a valid value', () => {
    expect(Object.keys(SAMPLE_EXPORT_CONTACT).sort()).toEqual(
      Object.keys(EXPORT_CONTACT_LIMITS).sort(),
    );
    expect(exportContactSchema.parse(SAMPLE_EXPORT_CONTACT)).toEqual(SAMPLE_EXPORT_CONTACT);
  });
});
