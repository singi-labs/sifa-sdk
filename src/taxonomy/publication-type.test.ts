import { describe, expect, it } from 'vitest';
import {
  PUBLICATION_TYPE_LABELS,
  PUBLICATION_TYPE_OPTIONS,
  getPublicationTypeLabel,
} from './publication-type.js';

describe('publication type taxonomy', () => {
  it('covers ORCID work types', () => {
    expect(PUBLICATION_TYPE_OPTIONS.length).toBe(36);
  });

  it('has no duplicate values', () => {
    const values = PUBLICATION_TYPE_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('uses ORCID slugs rather than id.sifa.defs tokens', () => {
    // Deliberate, and the one enum here that does this: the vocabulary is
    // ORCID's, so the data round-trips with no translation table.
    expect(PUBLICATION_TYPE_OPTIONS.every((o) => !o.value.startsWith('id.sifa.defs#'))).toBe(true);
  });

  it('labels every value', () => {
    expect(PUBLICATION_TYPE_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
    expect(Object.keys(PUBLICATION_TYPE_LABELS).length).toBe(PUBLICATION_TYPE_OPTIONS.length);
  });

  it('resolves a known type to its label', () => {
    expect(getPublicationTypeLabel('journal-article')).toBe('Journal Article');
  });

  it("labels ORCID's catch-all as Publication rather than Other", () => {
    // It shows on the card, and a badge reading "Other" tells a reader nothing.
    expect(getPublicationTypeLabel('other')).toBe('Publication');
  });

  it('falls back to the generic label for an unknown type', () => {
    // An ORCID work type is a slug. Rendering "spin-off-company" raw on a card
    // reads as a bug.
    expect(getPublicationTypeLabel('zine')).toBe('Publication');
  });

  it('returns undefined when there is no type', () => {
    expect(getPublicationTypeLabel(undefined)).toBeUndefined();
    expect(getPublicationTypeLabel(null)).toBeUndefined();
    expect(getPublicationTypeLabel('')).toBeUndefined();
  });
});
